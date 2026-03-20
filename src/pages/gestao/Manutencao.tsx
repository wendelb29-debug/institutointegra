import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Plus } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Maintenance = Database['public']['Tables']['maintenance_requests']['Row'];

const statusColors: Record<string, string> = {
  pendente: 'bg-accent/10 text-accent border-accent/20',
  em_andamento: 'bg-primary/10 text-primary border-primary/20',
  concluido: 'bg-muted text-muted-foreground',
};

const statusLabels: Record<string, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
};

const Manutencao = () => {
  const [items, setItems] = useState<Maintenance[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ priority: 'media' });
  const { toast } = useToast();
  const { user } = useAuth();

  const fetch_ = async () => {
    const [mRes, rRes] = await Promise.all([
      supabase.from('maintenance_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('rooms').select('id, name').order('name'),
    ]);
    setItems(mRes.data || []);
    setRooms(rRes.data || []);
  };

  useEffect(() => { fetch_(); }, []);

  const handleSave = async () => {
    if (!form.title) return;
    const { error } = await supabase.from('maintenance_requests').insert({
      title: form.title, description: form.description, room_id: form.room_id || null,
      priority: form.priority, requested_by: user?.id,
    });
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Chamado aberto!' });
    setOpen(false); setForm({ priority: 'media' }); fetch_();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('maintenance_requests').update({
      status: status as any,
      resolved_at: status === 'concluido' ? new Date().toISOString() : null,
    }).eq('id', id);
    fetch_();
  };

  const roomName = (id: string | null) => rooms.find(r => r.id === id)?.name || '—';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display text-foreground">Manutenção</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Chamado</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Chamado</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Título</Label><Input value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
              <div className="space-y-2"><Label>Descrição</Label><Textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sala</Label>
                  <Select value={form.room_id || ''} onValueChange={v => setForm({ ...form, room_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                    <SelectContent>{rooms.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleSave} className="w-full">Abrir Chamado</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(item => (
          <Card key={item.id} className="border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div>
                <CardTitle className="text-base font-semibold">{item.title}</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Sala: {roomName(item.room_id)}</p>
              </div>
              <Badge variant="outline" className={statusColors[item.status]}>{statusLabels[item.status]}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
              <div className="flex gap-2">
                {item.status !== 'em_andamento' && item.status !== 'concluido' && (
                  <Button size="sm" variant="outline" onClick={() => updateStatus(item.id, 'em_andamento')}>Iniciar</Button>
                )}
                {item.status !== 'concluido' && (
                  <Button size="sm" variant="outline" onClick={() => updateStatus(item.id, 'concluido')}>Concluir</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && <div className="col-span-full text-center py-12 text-muted-foreground">Nenhum chamado registrado.</div>}
      </div>
    </div>
  );
};

export default Manutencao;
