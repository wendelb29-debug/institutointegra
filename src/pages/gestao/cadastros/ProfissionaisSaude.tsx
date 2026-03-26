import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Search, UserCheck } from 'lucide-react';
import { SignaturePad } from '@/components/instituto/clinical/SignaturePad';

interface Professional {
  id: string;
  user_id: string;
  full_name: string;
  specialty: string;
  registration_number: string | null;
  phone: string | null;
  email: string | null;
  role_title: string | null;
  signature_url: string | null;
}

const ProfissionaisSaude = () => {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Professional | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ full_name: '', specialty: '', registration_number: '', phone: '', email: '', role_title: '' });
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchProfessionals = async () => {
    const { data } = await supabase.from('health_professionals' as any).select('*').order('full_name');
    setProfessionals((data as any[]) || []);
  };

  useEffect(() => { fetchProfessionals(); }, []);

  const handleSave = async () => {
    if (!form.full_name || !user) return;

    let signatureUrl = editing?.signature_url || null;
    if (signatureDataUrl) {
      const blob = await (await fetch(signatureDataUrl)).blob();
      const path = `${editing?.user_id || user.id}/signature_${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage.from('signatures').upload(path, blob, { upsert: true });
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('signatures').getPublicUrl(path);
        signatureUrl = urlData.publicUrl;
      }
    }

    const payload = {
      full_name: form.full_name,
      specialty: form.specialty,
      registration_number: form.registration_number || null,
      phone: form.phone || null,
      email: form.email || null,
      role_title: form.role_title || null,
      signature_url: signatureUrl,
    };

    if (editing) {
      const { error } = await supabase.from('health_professionals' as any).update(payload as any).eq('id', editing.id);
      if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Profissional atualizado!' });
    } else {
      const { error } = await supabase.from('health_professionals' as any).insert({ ...payload, user_id: user.id } as any);
      if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Profissional cadastrado!' });
    }

    setOpen(false);
    setEditing(null);
    setSignatureDataUrl(null);
    setForm({ full_name: '', specialty: '', registration_number: '', phone: '', email: '', role_title: '' });
    fetchProfessionals();
  };

  const startEdit = (p: Professional) => {
    setEditing(p);
    setForm({
      full_name: p.full_name,
      specialty: p.specialty,
      registration_number: p.registration_number || '',
      phone: p.phone || '',
      email: p.email || '',
      role_title: p.role_title || '',
    });
    setSignatureDataUrl(null);
    setOpen(true);
  };

  const filtered = professionals.filter(p =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    p.specialty.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-semibold text-foreground">Profissionais de Saúde</h1>
        <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) { setEditing(null); setSignatureDataUrl(null); } }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" />Novo Profissional</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? 'Editar' : 'Novo'} Profissional</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome Completo *</Label>
                <Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Especialidade *</Label>
                  <Input value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} placeholder="Ex: Psicologia, Estética" />
                </div>
                <div className="space-y-2">
                  <Label>Nº Registro/CRP</Label>
                  <Input value={form.registration_number} onChange={e => setForm({ ...form, registration_number: e.target.value })} placeholder="Ex: CRP 06/12345" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Cargo/Função</Label>
                <Input value={form.role_title} onChange={e => setForm({ ...form, role_title: e.target.value })} placeholder="Ex: Psicóloga Clínica" />
              </div>
              <div className="space-y-2">
                <Label>Assinatura Digital (Rubrica)</Label>
                {editing?.signature_url && !signatureDataUrl && (
                  <div className="border border-border rounded-lg p-2 bg-white mb-2">
                    <img src={editing.signature_url} alt="Assinatura atual" className="h-16 mx-auto" />
                    <p className="text-xs text-center text-muted-foreground mt-1">Assinatura atual. Desenhe abaixo para substituir.</p>
                  </div>
                )}
                <SignaturePad
                  onSave={(dataUrl) => setSignatureDataUrl(dataUrl)}
                  initialImage={editing?.signature_url || undefined}
                />
                {signatureDataUrl && (
                  <p className="text-xs text-green-600 flex items-center gap-1"><UserCheck className="h-3 w-3" />Nova assinatura capturada</p>
                )}
              </div>
              <Button onClick={handleSave} className="w-full" disabled={!form.full_name || !form.specialty}>
                {editing ? 'Atualizar' : 'Cadastrar'} Profissional
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar profissional..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Especialidade</TableHead>
                <TableHead>Registro</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Assinatura</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.full_name}</TableCell>
                  <TableCell>{p.specialty}</TableCell>
                  <TableCell>{p.registration_number || '—'}</TableCell>
                  <TableCell>{p.role_title || '—'}</TableCell>
                  <TableCell>
                    {p.signature_url ? (
                      <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Cadastrada</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">Pendente</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(p)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum profissional cadastrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfissionaisSaude;
