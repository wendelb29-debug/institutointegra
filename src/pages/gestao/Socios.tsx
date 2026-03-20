import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Partner = Database['public']['Tables']['partners']['Row'];

const Socios = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partner | null>(null);
  const [form, setForm] = useState<Partial<Partner>>({});
  const { toast } = useToast();

  const fetchPartners = async () => {
    const { data } = await supabase.from('partners').select('*').order('name');
    setPartners(data || []);
  };

  useEffect(() => { fetchPartners(); }, []);

  const handleSave = async () => {
    if (!form.name) return;
    if (editing) {
      const { error } = await supabase.from('partners').update(form).eq('id', editing.id);
      if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    } else {
      const { error } = await supabase.from('partners').insert({ name: form.name!, email: form.email, phone: form.phone, cpf: form.cpf, share_percentage: form.share_percentage });
      if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    }
    toast({ title: editing ? 'Sócio atualizado!' : 'Sócio adicionado!' });
    setOpen(false); setEditing(null); setForm({}); fetchPartners();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display text-foreground">Sócios</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditing(null); setForm({}); setOpen(true); }} className="gap-2"><Plus className="h-4 w-4" /> Novo Sócio</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? 'Editar Sócio' : 'Novo Sócio'}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Nome</Label><Input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>E-mail</Label><Input value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                <div className="space-y-2"><Label>Telefone</Label><Input value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>CPF</Label><Input value={form.cpf || ''} onChange={e => setForm({ ...form, cpf: e.target.value })} /></div>
                <div className="space-y-2"><Label>% Participação</Label><Input type="number" value={form.share_percentage ?? ''} onChange={e => setForm({ ...form, share_percentage: Number(e.target.value) })} /></div>
              </div>
              <Button onClick={handleSave} className="w-full">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {partners.map(p => (
          <Card key={p.id} className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <CardTitle className="text-base font-semibold">{p.name}</CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(p); setForm(p); setOpen(true); }}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              {p.email && <p>{p.email}</p>}
              {p.phone && <p>{p.phone}</p>}
              {p.share_percentage !== null && <p className="font-medium text-foreground">{Number(p.share_percentage)}% de participação</p>}
            </CardContent>
          </Card>
        ))}
        {partners.length === 0 && <div className="col-span-full text-center py-12 text-muted-foreground">Nenhum sócio cadastrado.</div>}
      </div>
    </div>
  );
};

export default Socios;
