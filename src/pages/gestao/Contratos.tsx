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
import { Plus, Link2, Copy, Eye, FileSignature } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

const statusColors: Record<string, string> = {
  ativo: 'bg-primary/10 text-primary',
  encerrado: 'bg-muted text-muted-foreground',
  pendente: 'bg-accent/10 text-accent',
};

const Contratos = () => {
  const [contracts, setContracts] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ status: 'pendente' });
  const [signatureDialog, setSignatureDialog] = useState<any>(null);
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

  const viewSignature = async (contractId: string) => {
    const { data } = await supabase.from('contract_signatures')
      .select('*')
      .eq('contract_id', contractId)
      .order('signed_at', { ascending: false })
      .limit(1)
      .single();
    if (data) setSignatureDialog(data);
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
                  <div className="flex items-center justify-end gap-1">
                    {c.signed_at ? (
                      <Button variant="ghost" size="sm" className="gap-1.5 text-primary" onClick={() => viewSignature(c.id)}>
                        <Eye className="h-3.5 w-3.5" /> Ver assinatura
                      </Button>
                    ) : c.signing_token ? (
                      <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => copyLink(c.signing_token)}>
                        <Copy className="h-3.5 w-3.5" /> Copiar link
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => generateSigningLink(c.id)}>
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
      <Dialog open={!!signatureDialog} onOpenChange={() => setSignatureDialog(null)}>
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Contratos;
