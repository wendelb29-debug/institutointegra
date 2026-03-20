import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Room = Database['public']['Tables']['rooms']['Row'];
type RoomInsert = Database['public']['Tables']['rooms']['Insert'];

const statusColors: Record<string, string> = {
  disponivel: 'bg-primary/10 text-primary border-primary/20',
  ocupada: 'bg-accent/10 text-accent border-accent/20',
  manutencao: 'bg-destructive/10 text-destructive border-destructive/20',
};

const statusLabels: Record<string, string> = {
  disponivel: 'Disponível',
  ocupada: 'Ocupada',
  manutencao: 'Manutenção',
};

const typeLabels: Record<string, string> = {
  hora: 'Por Hora',
  diaria: 'Diária',
  mensal: 'Mensal',
};

const Salas = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [form, setForm] = useState<Partial<RoomInsert>>({});
  const { toast } = useToast();

  const fetchRooms = async () => {
    const { data } = await supabase.from('rooms').select('*').order('name');
    setRooms(data || []);
  };

  useEffect(() => { fetchRooms(); }, []);

  const handleSave = async () => {
    if (!form.name) return;
    if (editing) {
      const { error } = await supabase.from('rooms').update(form).eq('id', editing.id);
      if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Sala atualizada!' });
    } else {
      const { error } = await supabase.from('rooms').insert(form as RoomInsert);
      if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Sala criada!' });
    }
    setOpen(false);
    setEditing(null);
    setForm({});
    fetchRooms();
  };

  const openEdit = (room: Room) => {
    setEditing(room);
    setForm(room);
    setOpen(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ type: 'hora', status: 'disponivel' });
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display text-foreground">Salas</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Nova Sala</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Sala' : 'Nova Sala'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={form.type || 'hora'} onValueChange={v => setForm({ ...form, type: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hora">Por Hora</SelectItem>
                      <SelectItem value="diaria">Diária</SelectItem>
                      <SelectItem value="mensal">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status || 'disponivel'} onValueChange={v => setForm({ ...form, status: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="disponivel">Disponível</SelectItem>
                      <SelectItem value="ocupada">Ocupada</SelectItem>
                      <SelectItem value="manutencao">Manutenção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>R$/hora</Label>
                  <Input type="number" value={form.price_hour ?? ''} onChange={e => setForm({ ...form, price_hour: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>R$/dia</Label>
                  <Input type="number" value={form.price_day ?? ''} onChange={e => setForm({ ...form, price_day: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>R$/mês</Label>
                  <Input type="number" value={form.price_month ?? ''} onChange={e => setForm({ ...form, price_month: Number(e.target.value) })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Capacidade</Label>
                <Input type="number" value={form.capacity ?? 1} onChange={e => setForm({ ...form, capacity: Number(e.target.value) })} />
              </div>
              <Button onClick={handleSave} className="w-full">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map(room => (
          <Card key={room.id} className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div>
                <CardTitle className="text-base font-semibold">{room.name}</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">{typeLabels[room.type]}</p>
              </div>
              <Badge variant="outline" className={statusColors[room.status]}>
                {statusLabels[room.status]}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex gap-4 text-sm text-muted-foreground">
                {room.price_hour > 0 && <span>R$ {Number(room.price_hour).toFixed(2)}/h</span>}
                {room.price_day > 0 && <span>R$ {Number(room.price_day).toFixed(2)}/dia</span>}
                {room.price_month > 0 && <span>R$ {Number(room.price_month).toFixed(2)}/mês</span>}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{room.capacity} pessoa{room.capacity !== 1 ? 's' : ''}</span>
                <Button variant="ghost" size="sm" onClick={() => openEdit(room)} className="gap-1">
                  <Pencil className="h-3 w-3" /> Editar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {rooms.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            Nenhuma sala cadastrada. Clique em "Nova Sala" para começar.
          </div>
        )}
      </div>
    </div>
  );
};

export default Salas;
