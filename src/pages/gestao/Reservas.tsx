import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, ChevronLeft, ChevronRight, Clock, Filter } from 'lucide-react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths,
  format, isSameMonth, isSameDay, isToday,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusColors: Record<string, string> = {
  confirmada: 'bg-primary/10 text-primary border-primary/20',
  pendente: 'bg-accent/10 text-accent border-accent/20',
  cancelada: 'bg-destructive/10 text-destructive border-destructive/20',
};

const statusDot: Record<string, string> = {
  confirmada: 'bg-primary',
  pendente: 'bg-accent',
  cancelada: 'bg-destructive',
};

const Reservas = () => {
  const [reservations, setReservations] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [allRooms, setAllRooms] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState<any>(null);
  const [form, setForm] = useState<any>({ status: 'pendente' });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filterRoom, setFilterRoom] = useState<string>('all');
  const { toast } = useToast();
  const { user } = useAuth();

  const fetch_ = async () => {
    const [rRes, roomRes, allRoomRes] = await Promise.all([
      supabase.from('reservations').select('*, rooms(name)').order('date', { ascending: true }),
      supabase.from('rooms').select('id, name, price_hour').eq('status', 'disponivel').order('name'),
      supabase.from('rooms').select('id, name').order('name'),
    ]);
    setReservations(rRes.data || []);
    setRooms(roomRes.data || []);
    setAllRooms(allRoomRes.data || []);
  };

  useEffect(() => { fetch_(); }, []);

  const filteredReservations = useMemo(() => {
    if (filterRoom === 'all') return reservations;
    return reservations.filter(r => r.room_id === filterRoom);
  }, [reservations, filterRoom]);

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

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('reservations').update({ status } as any).eq('id', id);
    toast({ title: `Reserva ${status}!` });
    setDetailOpen(null);
    fetch_();
  };

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const start = startOfWeek(monthStart, { locale: ptBR });
    const end = endOfWeek(monthEnd, { locale: ptBR });
    const days: Date[] = [];
    let day = start;
    while (day <= end) { days.push(day); day = addDays(day, 1); }
    return days;
  }, [currentMonth]);

  const reservationsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    filteredReservations.forEach(r => {
      if (!map[r.date]) map[r.date] = [];
      map[r.date].push(r);
    });
    return map;
  }, [filteredReservations]);

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const selectedDayReservations = selectedDate
    ? reservationsByDate[format(selectedDate, 'yyyy-MM-dd')] || []
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-display text-foreground">Reservas</h1>
        <div className="flex items-center gap-3">
          {/* Room filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterRoom} onValueChange={setFilterRoom}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="Filtrar por sala" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as salas</SelectItem>
                {allRooms.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
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
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input type="date" value={form.date || ''} onChange={e => setForm({ ...form, date: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Início</Label><Input type="time" value={form.start_time || ''} onChange={e => setForm({ ...form, start_time: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Fim</Label><Input type="time" value={form.end_time || ''} onChange={e => setForm({ ...form, end_time: e.target.value })} /></div>
                </div>
                <div className="space-y-2"><Label>Valor Total</Label><Input type="number" value={form.total_value || ''} onChange={e => setForm({ ...form, total_value: Number(e.target.value) })} /></div>
                <div className="space-y-2"><Label>Observações</Label><Input value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
                <Button onClick={handleSave} className="w-full">Reservar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-base font-semibold capitalize">
                {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
              </h2>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-7 border-b border-border/40">
              {dayNames.map(d => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2.5">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {calendarDays.map((day, i) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayReservations = reservationsByDate[dateKey] || [];
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const today = isToday(day);

                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(day)}
                    className={`
                      relative min-h-[72px] p-1.5 border-b border-r border-border/20 text-left transition-colors
                      ${!isCurrentMonth ? 'bg-muted/30 text-muted-foreground/50' : 'hover:bg-muted/40'}
                      ${isSelected ? 'bg-primary/5 ring-1 ring-primary/30' : ''}
                    `}
                  >
                    <span className={`
                      text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full
                      ${today ? 'bg-primary text-primary-foreground' : ''}
                    `}>
                      {format(day, 'd')}
                    </span>
                    <div className="mt-0.5 space-y-0.5">
                      {dayReservations.slice(0, 3).map((r: any) => (
                        <div key={r.id} className={`text-[10px] leading-tight truncate rounded px-1 py-0.5 ${statusColors[r.status] || 'bg-muted'}`}>
                          {r.rooms?.name}
                        </div>
                      ))}
                      {dayReservations.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">+{dayReservations.length - 3}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Day detail sidebar */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border/60 bg-card p-5">
            <h3 className="text-sm font-semibold mb-3">
              {selectedDate
                ? format(selectedDate, "dd 'de' MMMM, yyyy", { locale: ptBR })
                : 'Selecione um dia'}
            </h3>
            {selectedDate && selectedDayReservations.length === 0 && (
              <div className="text-sm text-muted-foreground py-6 text-center">
                <p>Nenhuma reserva neste dia.</p>
                <Button variant="outline" size="sm" className="mt-3 gap-1.5"
                  onClick={() => { setForm({ ...form, date: format(selectedDate, 'yyyy-MM-dd'), status: 'pendente' }); setOpen(true); }}>
                  <Plus className="h-3.5 w-3.5" /> Reservar
                </Button>
              </div>
            )}
            <div className="space-y-3">
              {selectedDayReservations.map((r: any) => (
                <button key={r.id} onClick={() => setDetailOpen(r)}
                  className="w-full text-left rounded-lg border border-border/40 p-3 hover:bg-muted/40 transition-colors space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{r.rooms?.name}</span>
                    <Badge variant="outline" className={`text-[10px] ${statusColors[r.status]}`}>{r.status}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{r.start_time?.slice(0, 5)} - {r.end_time?.slice(0, 5)}</span>
                    <span className="tabular-nums">R$ {Number(r.total_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-border/60 bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">Legenda</p>
            <div className="space-y-1.5">
              {Object.entries(statusDot).map(([status, color]) => (
                <div key={status} className="flex items-center gap-2 text-xs">
                  <div className={`h-2.5 w-2.5 rounded-full ${color}`} />
                  <span className="capitalize">{status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Reservation Detail Dialog */}
      <Dialog open={!!detailOpen} onOpenChange={() => setDetailOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Detalhes da Reserva</DialogTitle></DialogHeader>
          {detailOpen && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Sala:</span><p className="font-medium">{detailOpen.rooms?.name}</p></div>
                <div><span className="text-muted-foreground">Data:</span><p className="font-medium">{new Date(detailOpen.date).toLocaleDateString('pt-BR')}</p></div>
                <div><span className="text-muted-foreground">Horário:</span><p className="font-medium">{detailOpen.start_time?.slice(0, 5)} - {detailOpen.end_time?.slice(0, 5)}</p></div>
                <div><span className="text-muted-foreground">Valor:</span><p className="font-medium tabular-nums">R$ {Number(detailOpen.total_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge variant="outline" className={`ml-2 ${statusColors[detailOpen.status]}`}>{detailOpen.status}</Badge>
              </div>
              {detailOpen.notes && (
                <div><span className="text-sm text-muted-foreground">Observações:</span><p className="text-sm mt-1">{detailOpen.notes}</p></div>
              )}
              <div className="flex gap-2 pt-2">
                {detailOpen.status === 'pendente' && (
                  <>
                    <Button size="sm" onClick={() => updateStatus(detailOpen.id, 'confirmada')} className="flex-1">Confirmar</Button>
                    <Button size="sm" variant="destructive" onClick={() => updateStatus(detailOpen.id, 'cancelada')} className="flex-1">Cancelar</Button>
                  </>
                )}
                {detailOpen.status === 'confirmada' && (
                  <Button size="sm" variant="destructive" onClick={() => updateStatus(detailOpen.id, 'cancelada')} className="flex-1">Cancelar Reserva</Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Reservas;
