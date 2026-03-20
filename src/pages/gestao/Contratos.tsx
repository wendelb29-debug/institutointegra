import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, Link2, Copy, Eye, FileSignature, FileText, Download, Loader2 } from 'lucide-react';

const statusColors: Record<string, string> = {
  ativo: 'bg-primary/10 text-primary',
  encerrado: 'bg-muted text-muted-foreground',
  pendente: 'bg-accent/10 text-accent',
};

// Generate contract HTML for PDF
const generateContractHTML = (contract: any, signature?: any, type: 'minuta' | 'final' = 'minuta') => {
  const now = new Date();
  return `
<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  body { font-family: 'Georgia', serif; max-width: 700px; margin: 40px auto; padding: 40px; color: #1C1C1C; line-height: 1.7; }
  h1 { text-align: center; font-size: 22px; margin-bottom: 6px; letter-spacing: 1px; }
  .subtitle { text-align: center; font-size: 13px; color: #666; margin-bottom: 30px; }
  .section { margin: 24px 0; }
  .section-title { font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #3E5B4F; border-bottom: 1px solid #C2A66D; padding-bottom: 4px; margin-bottom: 12px; }
  .field { display: flex; margin: 6px 0; font-size: 13px; }
  .field-label { min-width: 160px; font-weight: bold; color: #555; }
  .field-value { flex: 1; }
  .terms { font-size: 12px; text-align: justify; }
  .terms p { margin: 8px 0; }
  .signature-area { margin-top: 40px; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
  .signature-img { max-width: 300px; max-height: 100px; }
  .photo-img { max-width: 150px; max-height: 150px; border-radius: 8px; }
  .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 16px; }
  .watermark { text-align: center; font-size: 11px; color: #C2A66D; font-weight: bold; margin-bottom: 20px; }
  ${type === 'minuta' ? '.draft-mark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 80px; color: rgba(194, 166, 109, 0.12); font-weight: bold; pointer-events: none; z-index: 0; }' : ''}
</style></head><body>
${type === 'minuta' ? '<div class="draft-mark">MINUTA</div>' : ''}
<div class="watermark">INTEGRA COWORKING</div>
<h1>CONTRATO DE LOCAÇÃO DE ESPAÇO</h1>
<p class="subtitle">${type === 'minuta' ? 'MINUTA — Documento preliminar' : 'CONTRATO ASSINADO DIGITALMENTE'}</p>

<div class="section">
  <div class="section-title">Dados do Contrato</div>
  <div class="field"><span class="field-label">Sala:</span><span class="field-value">${contract.rooms?.name || '—'}</span></div>
  <div class="field"><span class="field-label">Data de Início:</span><span class="field-value">${contract.start_date ? new Date(contract.start_date).toLocaleDateString('pt-BR') : '—'}</span></div>
  <div class="field"><span class="field-label">Data de Fim:</span><span class="field-value">${contract.end_date ? new Date(contract.end_date).toLocaleDateString('pt-BR') : 'Indeterminado'}</span></div>
  <div class="field"><span class="field-label">Valor Mensal:</span><span class="field-value">R$ ${Number(contract.monthly_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
  <div class="field"><span class="field-label">Status:</span><span class="field-value">${contract.status}</span></div>
</div>

<div class="section">
  <div class="section-title">Dados do Locatário</div>
  <div class="field"><span class="field-label">Nome:</span><span class="field-value">${contract.clients?.name || '—'}</span></div>
  <div class="field"><span class="field-label">CPF:</span><span class="field-value">${contract.clients?.cpf || '—'}</span></div>
  <div class="field"><span class="field-label">E-mail:</span><span class="field-value">${contract.clients?.email || '—'}</span></div>
</div>

<div class="section">
  <div class="section-title">Termos e Condições</div>
  <div class="terms">
    <p><strong>CLÁUSULA 1ª</strong> — O LOCADOR cede ao LOCATÁRIO o uso do espaço identificado acima, mediante pagamento do valor mensal estipulado, com vencimento todo dia 05 de cada mês.</p>
    <p><strong>CLÁUSULA 2ª</strong> — O LOCATÁRIO se compromete a utilizar o espaço exclusivamente para fins profissionais, respeitando as normas internas do estabelecimento.</p>
    <p><strong>CLÁUSULA 3ª</strong> — O presente contrato poderá ser rescindido por qualquer das partes mediante aviso prévio de 30 (trinta) dias.</p>
    <p><strong>CLÁUSULA 4ª</strong> — O LOCATÁRIO é responsável pela conservação do espaço locado e dos equipamentos disponibilizados.</p>
    <p><strong>CLÁUSULA 5ª</strong> — Este contrato é firmado em caráter digital, com validade jurídica conforme a Lei nº 14.063/2020 e o Marco Civil da Internet.</p>
    ${contract.notes ? `<p><strong>OBSERVAÇÕES:</strong> ${contract.notes}</p>` : ''}
  </div>
</div>

${type === 'final' && signature ? `
<div class="section">
  <div class="section-title">Assinatura Digital</div>
  <div class="signature-area">
    <div class="field"><span class="field-label">Signatário:</span><span class="field-value">${signature.signer_name}</span></div>
    <div class="field"><span class="field-label">CPF:</span><span class="field-value">${signature.signer_cpf || '—'}</span></div>
    <div class="field"><span class="field-label">E-mail:</span><span class="field-value">${signature.signer_email || '—'}</span></div>
    <div class="field"><span class="field-label">IP:</span><span class="field-value">${signature.ip_address || '—'}</span></div>
    <div class="field"><span class="field-label">Geolocalização:</span><span class="field-value">${signature.geolocation || '—'}</span></div>
    <div class="field"><span class="field-label">Data/Hora:</span><span class="field-value">${new Date(signature.signed_at).toLocaleString('pt-BR')}</span></div>
    <div class="field"><span class="field-label">User Agent:</span><span class="field-value" style="font-size:10px;word-break:break-all">${signature.user_agent || '—'}</span></div>
    ${signature.signature_data ? `<div style="margin-top:12px"><p style="font-size:12px;color:#666;margin-bottom:4px">Assinatura:</p><img class="signature-img" src="${signature.signature_data}" /></div>` : ''}
    ${signature.photo_url ? `<div style="margin-top:12px"><p style="font-size:12px;color:#666;margin-bottom:4px">Foto do signatário:</p><img class="photo-img" src="${signature.photo_url}" /></div>` : ''}
  </div>
</div>
` : `
<div class="section">
  <div class="section-title">Assinatura</div>
  <p style="font-size:13px;color:#999;">Aguardando assinatura digital do locatário.</p>
  <div style="margin-top:30px;border-bottom:1px solid #333;width:300px;"></div>
  <p style="font-size:11px;color:#666;margin-top:4px">${contract.clients?.name || 'Locatário'}</p>
</div>
`}

<div class="footer">
  <p>Documento gerado em ${now.toLocaleString('pt-BR')} — Integra Coworking</p>
  <p>Este documento tem validade jurídica conforme legislação vigente.</p>
</div>
</body></html>`;
};

const downloadPDF = (html: string, filename: string) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.document.title = filename;
  setTimeout(() => {
    printWindow.print();
  }, 500);
};

const Contratos = () => {
  const [contracts, setContracts] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ status: 'pendente' });
  const [signatureDialog, setSignatureDialog] = useState<any>(null);
  const [sigContract, setSigContract] = useState<any>(null);
  const { toast } = useToast();

  const fetch_ = async () => {
    const [cRes, clRes, rRes] = await Promise.all([
      supabase.from('contracts').select('*, clients(name, email, cpf), rooms(name), contract_signatures(id, signed_at, signer_name)').order('created_at', { ascending: false }),
      supabase.from('clients').select('id, name').order('name'),
      supabase.from('rooms').select('id, name').order('name'),
    ]);
    setContracts(cRes.data || []);
    setClients(clRes.data || []);
    setRooms(rRes.data || []);
  };

  useEffect(() => { fetch_(); }, []);

  const handleSave = async () => {
    if (!form.client_id || !form.room_id || !form.start_date) return;
    const { error } = await supabase.from('contracts').insert({
      client_id: form.client_id, room_id: form.room_id, start_date: form.start_date,
      end_date: form.end_date || null, monthly_value: form.monthly_value || 0,
      status: form.status, notes: form.notes,
    });
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Contrato criado!' });
    setOpen(false); setForm({ status: 'pendente' }); fetch_();
  };

  const generateSigningLink = async (contractId: string) => {
    const token = crypto.randomUUID();
    const { error } = await supabase.from('contracts')
      .update({ signing_token: token } as any)
      .eq('id', contractId);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    const link = `${window.location.origin}/assinar?token=${token}`;
    await navigator.clipboard.writeText(link);
    toast({ title: 'Link copiado!', description: 'Link de assinatura copiado para a área de transferência.' });
    fetch_();
  };

  const copyLink = (token: string) => {
    const link = `${window.location.origin}/assinar?token=${token}`;
    navigator.clipboard.writeText(link);
    toast({ title: 'Link copiado!' });
  };

  const viewSignature = async (contractId: string, contract: any) => {
    const { data } = await supabase.from('contract_signatures')
      .select('*')
      .eq('contract_id', contractId)
      .order('signed_at', { ascending: false })
      .limit(1)
      .single();
    if (data) {
      setSignatureDialog(data);
      setSigContract(contract);
    }
  };

  const downloadMinuta = (contract: any) => {
    const html = generateContractHTML(contract, null, 'minuta');
    downloadPDF(html, `Minuta_${contract.clients?.name || 'contrato'}.pdf`);
  };

  const downloadFinal = async (contract: any) => {
    const { data: sig } = await supabase.from('contract_signatures')
      .select('*')
      .eq('contract_id', contract.id)
      .order('signed_at', { ascending: false })
      .limit(1)
      .single();
    const html = generateContractHTML(contract, sig, 'final');
    downloadPDF(html, `Contrato_Assinado_${contract.clients?.name || 'contrato'}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display text-foreground">Contratos</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Contrato</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Contrato</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select value={form.client_id || ''} onValueChange={v => setForm({ ...form, client_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sala</Label>
                <Select value={form.room_id || ''} onValueChange={v => setForm({ ...form, room_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{rooms.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Início</Label><Input type="date" value={form.start_date || ''} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
                <div className="space-y-2"><Label>Fim</Label><Input type="date" value={form.end_date || ''} onChange={e => setForm({ ...form, end_date: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Valor Mensal</Label><Input type="number" value={form.monthly_value || ''} onChange={e => setForm({ ...form, monthly_value: Number(e.target.value) })} /></div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="encerrado">Encerrado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2"><Label>Observações</Label><Input value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
              <Button onClick={handleSave} className="w-full">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border border-border/60 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Sala</TableHead>
              <TableHead>Início</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.map((c: any) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.clients?.name}</TableCell>
                <TableCell>{c.rooms?.name}</TableCell>
                <TableCell>{new Date(c.start_date).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell className="tabular-nums">R$ {Number(c.monthly_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                <TableCell><Badge variant="outline" className={statusColors[c.status]}>{c.status}</Badge></TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1 flex-wrap">
                    {/* PDF Minuta */}
                    <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" onClick={() => downloadMinuta(c)} title="Baixar minuta">
                      <FileText className="h-3.5 w-3.5" /> Minuta
                    </Button>

                    {/* Signing actions */}
                    {c.signed_at ? (
                      <>
                        <Button variant="ghost" size="sm" className="gap-1 text-primary" onClick={() => viewSignature(c.id, c)}>
                          <Eye className="h-3.5 w-3.5" /> Assinatura
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-1 text-primary" onClick={() => downloadFinal(c)} title="Baixar contrato assinado">
                          <Download className="h-3.5 w-3.5" /> PDF Final
                        </Button>
                      </>
                    ) : c.signing_token ? (
                      <Button variant="ghost" size="sm" className="gap-1" onClick={() => copyLink(c.signing_token)}>
                        <Copy className="h-3.5 w-3.5" /> Link
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" className="gap-1" onClick={() => generateSigningLink(c.id)}>
                        <Link2 className="h-3.5 w-3.5" /> Gerar link
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {contracts.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum contrato cadastrado.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>

      {/* Signature Detail Dialog */}
      <Dialog open={!!signatureDialog} onOpenChange={() => { setSignatureDialog(null); setSigContract(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><FileSignature className="h-5 w-5 text-primary" /> Detalhes da Assinatura</DialogTitle></DialogHeader>
          {signatureDialog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Nome:</span><p className="font-medium">{signatureDialog.signer_name}</p></div>
                <div><span className="text-muted-foreground">CPF:</span><p className="font-medium">{signatureDialog.signer_cpf || '—'}</p></div>
                <div><span className="text-muted-foreground">E-mail:</span><p className="font-medium">{signatureDialog.signer_email || '—'}</p></div>
                <div><span className="text-muted-foreground">IP:</span><p className="font-medium tabular-nums">{signatureDialog.ip_address || '—'}</p></div>
                <div><span className="text-muted-foreground">Localização:</span><p className="font-medium">{signatureDialog.geolocation || '—'}</p></div>
                <div><span className="text-muted-foreground">Data:</span><p className="font-medium">{new Date(signatureDialog.signed_at).toLocaleString('pt-BR')}</p></div>
              </div>
              {signatureDialog.photo_url && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Foto:</p>
                  <img src={signatureDialog.photo_url} alt="Foto do signatário" className="w-full rounded-lg max-h-48 object-cover" />
                </div>
              )}
              {signatureDialog.signature_data && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Assinatura:</p>
                  <div className="border border-border rounded-lg p-2 bg-white">
                    <img src={signatureDialog.signature_data} alt="Assinatura" className="w-full" />
                  </div>
                </div>
              )}
              {sigContract && (
                <Button className="w-full gap-2" onClick={() => downloadFinal(sigContract)}>
                  <Download className="h-4 w-4" /> Baixar Contrato Assinado (PDF)
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Contratos;
