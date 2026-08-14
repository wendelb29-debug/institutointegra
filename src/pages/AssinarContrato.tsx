import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Camera, MapPin, PenTool, AlertCircle, Loader2 } from 'lucide-react';
import logoIntegra from '@/assets/logo_integra.png';

const AssinarContrato = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { toast } = useToast();

  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'info' | 'photo' | 'signature' | 'done' | 'error' | 'already_signed'>('info');
  const [submitting, setSubmitting] = useState(false);

  // Signer data
  const [signerName, setSignerName] = useState('');
  const [signerCpf, setSignerCpf] = useState('');
  const [signerEmail, setSignerEmail] = useState('');

  // Photo
  const videoRef = useRef<HTMLVideoElement>(null);
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Signature canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Geolocation
  const [geo, setGeo] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { setStep('error'); setLoading(false); return; }
    supabase
      .from('contracts')
      .select('*, clients(name, email, cpf), rooms(name)')
      .eq('signing_token', token)
      .single()
      .then(({ data, error }) => {
        setLoading(false);
        if (error || !data) { setStep('error'); return; }
        if (data.signed_at) { setStep('already_signed'); setContract(data); return; }
        setContract(data);
        setSignerName(data.clients?.name || '');
        setSignerEmail(data.clients?.email || '');
        setSignerCpf(data.clients?.cpf || '');
      });

    // Get geolocation
    navigator.geolocation?.getCurrentPosition(
      (pos) => setGeo(`${pos.coords.latitude},${pos.coords.longitude}`),
      () => setGeo('não disponível')
    );
  }, [token]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível acessar a câmera.', variant: 'destructive' });
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    setPhotoData(canvas.toDataURL('image/jpeg', 0.8));
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
  };

  // Signature drawing
  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1C1C1C';
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const clearSignature = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !canvasRef.current) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHasSignature(false);
  };

  const handleSubmit = async () => {
    if (!contract || !hasSignature || !signerName) return;
    setSubmitting(true);

    try {
      let photoUrl = '';
      // Upload photo if captured
      if (photoData) {
        const blob = await fetch(photoData).then(r => r.blob());
        const path = `photos/${contract.id}_${Date.now()}.jpg`;
        const { error } = await supabase.storage.from('contract-signatures').upload(path, blob);
        if (!error) photoUrl = path;
      }

      // Get signature data
      const signatureData = canvasRef.current?.toDataURL('image/png') || '';

      // Get IP (best effort)
      let ip = '';
      try {
        const resp = await fetch('https://api.ipify.org?format=json');
        const data = await resp.json();
        ip = data.ip;
      } catch { /* ignore */ }

      // Insert signature record
      const { error: sigError } = await supabase.from('contract_signatures').insert({
        contract_id: contract.id,
        signer_name: signerName,
        signer_cpf: signerCpf,
        signer_email: signerEmail,
        ip_address: ip,
        geolocation: geo || 'não disponível',
        photo_url: photoUrl,
        signature_data: signatureData,
        user_agent: navigator.userAgent,
      });

      if (sigError) throw sigError;

      // Update contract status
      await supabase.from('contracts')
        .update({ status: 'ativo' as any, signed_at: new Date().toISOString() })
        .eq('id', contract.id);

      setStep('done');
    } catch (err: any) {
      toast({ title: 'Erro ao assinar', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (step === 'error') return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="max-w-md w-full text-center">
        <CardContent className="pt-8 pb-8 space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-xl font-display">Link inválido</h2>
          <p className="text-muted-foreground">Este link de assinatura é inválido ou expirou.</p>
        </CardContent>
      </Card>
    </div>
  );

  if (step === 'already_signed') return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="max-w-md w-full text-center">
        <CardContent className="pt-8 pb-8 space-y-4">
          <CheckCircle className="h-12 w-12 text-primary mx-auto" />
          <h2 className="text-xl font-display">Contrato já assinado</h2>
          <p className="text-muted-foreground">Este contrato já foi assinado anteriormente.</p>
        </CardContent>
      </Card>
    </div>
  );

  if (step === 'done') return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="max-w-md w-full text-center">
        <CardContent className="pt-8 pb-8 space-y-4">
          <CheckCircle className="h-12 w-12 text-primary mx-auto" />
          <h2 className="text-xl font-display">Contrato assinado!</h2>
          <p className="text-muted-foreground">Sua assinatura foi registrada com sucesso. Você receberá uma confirmação por e-mail.</p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <img src={logoIntegra} alt="Integra" className="h-12 mx-auto" />
          <h1 className="text-2xl font-display">Assinatura de Contrato</h1>
        </div>

        {/* Contract Info */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Detalhes do Contrato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Sala:</span><span className="font-medium">{contract?.rooms?.name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Início:</span><span>{contract?.start_date && new Date(contract.start_date).toLocaleDateString('pt-BR')}</span></div>
            {contract?.end_date && <div className="flex justify-between"><span className="text-muted-foreground">Fim:</span><span>{new Date(contract.end_date).toLocaleDateString('pt-BR')}</span></div>}
            <div className="flex justify-between"><span className="text-muted-foreground">Valor mensal:</span><span className="font-medium tabular-nums">R$ {Number(contract?.monthly_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
          </CardContent>
        </Card>

        {/* Step: Info */}
        {step === 'info' && (
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><PenTool className="h-4 w-4 text-primary" /> Dados do Signatário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>Nome completo</Label><Input value={signerName} onChange={e => setSignerName(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>CPF</Label><Input value={signerCpf} onChange={e => setSignerCpf(e.target.value)} /></div>
                <div className="space-y-2"><Label>E-mail</Label><Input value={signerEmail} onChange={e => setSignerEmail(e.target.value)} /></div>
              </div>
              {geo && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" /> Localização capturada
                </div>
              )}
              <Button className="w-full" onClick={() => { setStep('photo'); startCamera(); }} disabled={!signerName}>
                Continuar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step: Photo */}
        {step === 'photo' && (
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Camera className="h-4 w-4 text-primary" /> Foto do Signatário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!photoData ? (
                <>
                  <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg bg-muted aspect-video object-cover" />
                  <Button onClick={capturePhoto} className="w-full">Capturar Foto</Button>
                </>
              ) : (
                <>
                  <img src={photoData} alt="Foto" className="w-full rounded-lg aspect-video object-cover" />
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => { setPhotoData(null); startCamera(); }}>Tirar outra</Button>
                    <Button className="flex-1" onClick={() => setStep('signature')}>Continuar</Button>
                  </div>
                </>
              )}
              <button onClick={() => setStep('signature')} className="text-sm text-muted-foreground hover:text-foreground transition-colors block mx-auto">
                Pular foto
              </button>
            </CardContent>
          </Card>
        )}

        {/* Step: Signature */}
        {step === 'signature' && (
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><PenTool className="h-4 w-4 text-primary" /> Assinatura Digital</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Desenhe sua assinatura no campo abaixo:</p>
              <div className="border border-border rounded-lg overflow-hidden bg-white">
                <canvas
                  ref={canvasRef}
                  width={560}
                  height={200}
                  className="w-full cursor-crosshair touch-none"
                  onMouseDown={startDraw}
                  onMouseMove={draw}
                  onMouseUp={() => setIsDrawing(false)}
                  onMouseLeave={() => setIsDrawing(false)}
                  onTouchStart={startDraw}
                  onTouchMove={draw}
                  onTouchEnd={() => setIsDrawing(false)}
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={clearSignature} className="flex-1">Limpar</Button>
                <Button onClick={handleSubmit} disabled={!hasSignature || submitting} className="flex-1">
                  {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Assinando...</> : 'Assinar Contrato'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Ao assinar, você confirma que leu e concorda com os termos deste contrato. Seu IP, localização e dados serão registrados para validade jurídica.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AssinarContrato;
