import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, CalendarDays, Users } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Event = Database['public']['Tables']['instituto_events']['Row'];

const InstitutoGestao = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({});
  const { toast } = useToast();

  const fetch_ = async () => {
    const [eRes, rRes] = await Promise.all([
      supabase.from('instituto_events').select('*').order('event_date', { ascending: false }),
      supabase.from('rooms').select('id, name').order('name'),
    ]);
    setEvents(eRes.data || []);
    setRooms(rRes.data || []);
  };

  useEffect(() => { fetch_(); }, []);

  const handleSave = async () => {
    if (!form.title || !form.event_date) return;
    const { error } = await supabase.from('instituto_events').insert({
      title: form.title, description: form.description, event_date: form.event_date,
      start_time: form.start_time, end_time: form.end_time, room_id: form.room_id || null,
      max_participants: form.max_participants || 20, instructor: form.instructor, category: form.category,
    });
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Evento criado!' });
    setOpen(false); setForm({}); fetch_();
  };

  const roomName = (id: string | null) => rooms.find(r => r.id === id)?.name || '—';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display text-foreground">Instituto Integra</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Evento</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Evento</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Título</Label><Input value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
              <div className="space-y-2"><Label>Descrição</Label><Textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Data</Label><Input type="date" value={form.event_date || ''} onChange={e => setForm({ ...form, event_date: e.target.value })} /></div>
                <div className="space-y-2">
                  <Label>Sala</Label>
                  <Select value={form.room_id || ''} onValueChange={v => setForm({ ...form, room_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                    <SelectContent>{rooms.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Início</Label><Input type="time" value={form.start_time || ''} onChange={e => setForm({ ...form, start_time: e.target.value })} /></div>
                <div className="space-y-2"><Label>Fim</Label><Input type="time" value={form.end_time || ''} onChange={e => setForm({ ...form, end_time: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Instrutor</Label><Input value={form.instructor || ''} onChange={e => setForm({ ...form, instructor: e.target.value })} /></div>
                <div className="space-y-2"><Label>Máx. Participantes</Label><Input type="number" value={form.max_participants || 20} onChange={e => setForm({ ...form, max_participants: Number(e.target.value) })} /></div>
              </div>
              <Button onClick={handleSave} className="w-full">Criar Evento</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map(ev => (
          <Card key={ev.id} className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">{ev.title}</CardTitle>
              {ev.category && <p className="text-xs text-accent font-medium">{ev.category}</p>}
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-3.5 w-3.5" />
                <span>{new Date(ev.event_date).toLocaleDateString('pt-BR')}</span>
                {ev.start_time && <span>{ev.start_time.slice(0,5)} - {ev.end_time?.slice(0,5)}</span>}
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5" />
                <span>{ev.current_participants}/{ev.max_participants} participantes</span>
              </div>
              {ev.instructor && <p>Instrutor: {ev.instructor}</p>}
              <p>Sala: {roomName(ev.room_id)}</p>
            </CardContent>
          </Card>
        ))}
        {events.length === 0 && <div className="col-span-full text-center py-12 text-muted-foreground">Nenhum evento cadastrado.</div>}
      </div>
    </div>
  );
};

export default InstitutoGestao;
