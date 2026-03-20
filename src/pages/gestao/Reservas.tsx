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
import { useAuth } from '@/contexts/AuthContext';
import { Plus } from 'lucide-react';

const statusColors: Record<string, string> = {
  confirmada: 'bg-primary/10 text-primary',
  pendente: 'bg-accent/10 text-accent',
  cancelada: 'bg-destructive/10 text-destructive',
};

const Reservas = () => {
  const [reservations, setReservations] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ status: 'pendente' });
  const { toast } = useToast();
  const { user } = useAuth();

  const fetch_ = async () => {
    const [rRes, roomRes] = await Promise.all([
      supabase.from('reservations').select('*, rooms(name)').order('date', { ascending: false }),
      supabase.from('rooms').select('id, name, price_hour').eq('status', 'disponivel').order('name'),
    ]);
    setReservations(rRes.data || []);
    setRooms(roomRes.data || []);
  };

  useEffect(() => { fetch_(); }, []);

  const handleSave = async () => {
    if (!form.room_id || !form.date || !form.start_time || !form.end_time) return;
    const { error } = await supabase.from('reservations').insert({
      room_id: form.room_id, date: form.date, start_time: form.start_time,
      end_time: form.end_time, status: form.status, user_id: user?.id,
      total_value: form.total_value || 0, notes: form.notes,
    });
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Reserva criada!' });
    setOpen(false); setForm({ status: 'pendente' }); fetch_();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display text-foreground">Reservas</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Nova Reserva</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Reserva</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Sala</Label>
                <Select value={form.room_id || ''} onValueChange={v => setForm({ ...form, room_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{rooms.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Data</Label><Input type="date" value={form.date || ''} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Início</Label><Input type="time" value={form.start_time || ''} onChange={e => setForm({ ...form, start_time: e.target.value })} /></div>
                <div className="space-y-2"><Label>Fim</Label><Input type="time" value={form.end_time || ''} onChange={e => setForm({ ...form, end_time: e.target.value })} /></div>
              </div>
              <div className="space-y-2"><Label>Valor Total</Label><Input type="number" value={form.total_value || ''} onChange={e => setForm({ ...form, total_value: Number(e.target.value) })} /></div>
              <Button onClick={handleSave} className="w-full">Reservar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border border-border/60 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Sala</TableHead><TableHead>Data</TableHead><TableHead>Horário</TableHead><TableHead>Valor</TableHead><TableHead>Status</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {reservations.map((r: any) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.rooms?.name}</TableCell>
                <TableCell>{new Date(r.date).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell>{r.start_time?.slice(0,5)} - {r.end_time?.slice(0,5)}</TableCell>
                <TableCell className="tabular-nums">R$ {Number(r.total_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                <TableCell><Badge variant="outline" className={statusColors[r.status]}>{r.status}</Badge></TableCell>
              </TableRow>
            ))}
            {reservations.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma reserva registrada.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Reservas;
