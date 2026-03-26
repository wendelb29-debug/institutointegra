import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Client = Database['public']['Tables']['clients']['Row'];

const Clientes = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState<Partial<Client>>({});
  const { toast } = useToast();

  const fetch_ = async () => {
    const { data } = await supabase.from('clients').select('*').order('name');
    setClients(data || []);
  };

  useEffect(() => { fetch_(); }, []);

  const handleSave = async () => {
    if (!form.name) return;
    if (editing) {
      const { error } = await supabase.from('clients').update(form).eq('id', editing.id);
      if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    } else {
      const { error } = await supabase.from('clients').insert({ name: form.name!, email: form.email, phone: form.phone, cpf: form.cpf, company: form.company, address: form.address });
      if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    }
    toast({ title: editing ? 'Cliente atualizado!' : 'Cliente adicionado!' });
    setOpen(false); setEditing(null); setForm({}); fetch_();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este cliente?')) return;
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Cliente excluído!' });
    fetch_();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display text-foreground">Clientes</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditing(null); setForm({}); setOpen(true); }} className="gap-2"><Plus className="h-4 w-4" /> Novo Cliente</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Nome</Label><Input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>E-mail</Label><Input value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                <div className="space-y-2"><Label>Telefone</Label><Input value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>CPF</Label><Input value={form.cpf || ''} onChange={e => setForm({ ...form, cpf: e.target.value })} /></div>
                <div className="space-y-2"><Label>Empresa</Label><Input value={form.company || ''} onChange={e => setForm({ ...form, company: e.target.value })} /></div>
              </div>
              <div className="space-y-2"><Label>Endereço</Label><Input value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
              <Button onClick={handleSave} className="w-full">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border border-border/60 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Nome</TableHead><TableHead>E-mail</TableHead><TableHead>Telefone</TableHead><TableHead>Empresa</TableHead><TableHead className="w-20 text-right">Ações</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {clients.map(c => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>{c.email || '—'}</TableCell>
                <TableCell>{c.phone || '—'}</TableCell>
                <TableCell>{c.company || '—'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(c); setForm(c); setOpen(true); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(c.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {clients.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum cliente cadastrado.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Clientes;
