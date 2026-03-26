import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, FileText, Upload, Calendar, FileDown } from 'lucide-react';
import { AIAssistantButton } from './AIAssistantButton';
import { TemplatesPanel } from './TemplatesPanel';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { generateClinicalPdf } from '@/lib/generateClinicalPdf';

export function ClinicalRecords({ patientId, patientName }: { patientId: string; patientName?: string }) {
  const [records, setRecords] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfExportType, setPdfExportType] = useState<'last' | 'period' | 'all'>('last');
  const [pdfPeriod, setPdfPeriod] = useState({ start: '', end: '' });
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [form, setForm] = useState({ session_date: new Date().toISOString().split('T')[0], observations: '' });
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<string[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchRecords = async () => {
    const { data } = await supabase
      .from('clinical_records')
      .select('*')
      .eq('patient_id', patientId)
      .order('session_date', { ascending: false });
    setRecords(data || []);
  };

  useEffect(() => { fetchRecords(); }, [patientId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploading(true);
    const uploaded: string[] = [];
    for (const file of Array.from(e.target.files)) {
      const ext = file.name.split('.').pop();
      const path = `${patientId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('clinical-files').upload(path, file);
      if (!error) {
        const { data: urlData } = supabase.storage.from('clinical-files').getPublicUrl(path);
        uploaded.push(urlData.publicUrl);
      }
    }
    setFiles(prev => [...prev, ...uploaded]);
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.observations || !user) return;
    const { error } = await supabase.from('clinical_records').insert({
      patient_id: patientId,
      psychologist_id: user.id,
      session_date: form.session_date,
      observations: form.observations,
      attachments: files,
    });
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Registro salvo!' });
    setOpen(false);
    setForm({ session_date: new Date().toISOString().split('T')[0], observations: '' });
    setFiles([]);
    fetchRecords();
  };

  const handleGeneratePdf = async () => {
    if (!user || records.length === 0) return;
    setGeneratingPdf(true);
    try {
      // Get professional profile
      const { data: prof } = await supabase
        .from('health_professionals' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const professional = prof ? {
        full_name: (prof as any).full_name,
        specialty: (prof as any).specialty,
        registration_number: (prof as any).registration_number,
        signature_url: (prof as any).signature_url,
      } : {
        full_name: user.user_metadata?.full_name || user.email || 'Profissional',
        specialty: '',
      };

      let selectedRecords = records;
      if (pdfExportType === 'last') {
        selectedRecords = records.slice(0, 1);
      } else if (pdfExportType === 'period' && pdfPeriod.start && pdfPeriod.end) {
        selectedRecords = records.filter(r =>
          r.session_date >= pdfPeriod.start && r.session_date <= pdfPeriod.end
        );
      }

      if (selectedRecords.length === 0) {
        toast({ title: 'Nenhum registro encontrado no período', variant: 'destructive' });
        setGeneratingPdf(false);
        return;
      }

      const blob = await generateClinicalPdf({
        type: 'prontuario',
        patientName: patientName || 'Paciente',
        professional,
        content: selectedRecords.map(r => ({ date: r.session_date, text: r.observations || '' })),
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prontuario_${(patientName || 'paciente').replace(/\s+/g, '_')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'PDF gerado com sucesso!' });
      setPdfOpen(false);
    } catch (err) {
      toast({ title: 'Erro ao gerar PDF', variant: 'destructive' });
    }
    setGeneratingPdf(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Prontuário</CardTitle>
        <div className="flex gap-2">
          <Dialog open={pdfOpen} onOpenChange={setPdfOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1" disabled={records.length === 0}>
                <FileDown className="h-3.5 w-3.5" />Gerar PDF
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Gerar PDF do Prontuário</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo de exportação</Label>
                  <Select value={pdfExportType} onValueChange={(v: any) => setPdfExportType(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="last">Última sessão</SelectItem>
                      <SelectItem value="period">Período específico</SelectItem>
                      <SelectItem value="all">Histórico completo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {pdfExportType === 'period' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Data início</Label>
                      <Input type="date" value={pdfPeriod.start} onChange={e => setPdfPeriod({ ...pdfPeriod, start: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Data fim</Label>
                      <Input type="date" value={pdfPeriod.end} onChange={e => setPdfPeriod({ ...pdfPeriod, end: e.target.value })} />
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">⚠️ O PDF incluirá assinatura digital do profissional, se cadastrada.</p>
                <Button onClick={handleGeneratePdf} className="w-full" disabled={generatingPdf}>
                  {generatingPdf ? 'Gerando...' : 'Gerar e Baixar PDF'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1"><Plus className="h-3.5 w-3.5" />Novo Registro</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo Registro de Prontuário</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Data da Sessão</Label>
                  <Input type="date" value={form.session_date} onChange={e => setForm({ ...form, session_date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea rows={6} value={form.observations} onChange={e => setForm({ ...form, observations: e.target.value })} placeholder="Descrição detalhada da sessão..." />
                  <div className="flex gap-2 flex-wrap">
                    <AIAssistantButton
                      text={form.observations}
                      onApply={(result) => setForm({ ...form, observations: result })}
                      context="prontuario"
                      compact
                    />
                    <TemplatesPanel
                      onInsert={(text) => setForm({ ...form, observations: form.observations ? form.observations + '\n\n' + text : text })}
                      context="prontuario"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Anexos</Label>
                  <Input type="file" multiple onChange={handleFileUpload} disabled={uploading} />
                  {files.length > 0 && <p className="text-xs text-muted-foreground">{files.length} arquivo(s) anexado(s)</p>}
                </div>
                <Button onClick={handleSave} className="w-full" disabled={!form.observations}>Salvar Registro</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">Nenhum registro no prontuário.</p>
        ) : (
          <div className="space-y-3">
            {records.map(r => (
              <div key={r.id} className="border border-border/60 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{format(new Date(r.session_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{r.observations}</p>
                {r.attachments && (r.attachments as string[]).length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {(r.attachments as string[]).map((url: string, i: number) => (
                      <a key={i} href={url} target="_blank" rel="noopener" className="text-xs text-primary hover:underline flex items-center gap-1">
                        <FileText className="h-3 w-3" />Anexo {i + 1}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
