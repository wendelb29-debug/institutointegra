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
import { Plus, ChevronLeft, ChevronRight, Clock, Filter, MessageCircle, CreditCard, FileSignature, User } from 'lucide-react';
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

const paymentColors: Record<string, string> = {
  pendente: 'bg-accent/10 text-accent',
  aprovado: 'bg-primary/10 text-primary',
  recusado: 'bg-destructive/10 text-destructive',
};

// Determine the dominant type of reservations for a day
const getDayColor = (dayReservations: any[], rooms: any[]): string => {
  if (!dayReservations || dayReservations.length === 0) return 'bg-white';
  
  // Check room types for the reservations
  const types = dayReservations.map(r => {
    const room = rooms.find((rm: any) => rm.id === r.room_id);
    return room?.type || 'hora';
  });

  const hasDaily = types.includes('diaria');
  const hasHourly = types.includes('hora');
  const hasMonthly = types.includes('mensal');

  // Priority: diaria (green) > mensal (blue) > hora (yellow)
  if (hasDaily || hasMonthly) return 'bg-emerald-100 border-emerald-300';
  if (hasHourly) return 'bg-amber-100 border-amber-300';
  return 'bg-emerald-100 border-emerald-300';
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
      supabase.from('reservations').select('*, rooms(name, type)').order('date', { ascending: true }),
      supabase.from('rooms').select('id, name, price_hour, type').eq('status', 'disponivel').order('name'),
      supabase.from('rooms').select('id, name, type').order('name'),
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
    const paymentLink = `https://paypal.me/integracoworking/${form.total_value || 0}`;
    const { error } = await supabase.from('reservations').insert({
      room_id: form.room_id, date: form.date, start_time: form.start_time,
      end_time: form.end_time, status: 'pendente', user_id: user?.id,
      total_value: form.total_value || 0, notes: form.notes,
      payment_status: 'pendente', payment_link: paymentLink,
    } as any);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Reserva criada!' });
    setOpen(false); setForm({ status: 'pendente' }); fetch_();
  };

  const updatePaymentStatus = async (id: string, status: string) => {
    if (status === 'aprovado') {
      await supabase.from('reservations').update({ payment_status: 'aprovado' } as any).eq('id', id);
      toast({ title: 'Pagamento aprovado!', description: 'Agora aguardando assinatura do contrato.' });
    } else {
      await supabase.from('reservations').update({ payment_status: status } as any).eq('id', id);
      toast({ title: `Pagamento ${status}!` });
    }
    setDetailOpen(null);
    fetch_();
  };

  const confirmReservation = async (id: string) => {
    const reservation = reservations.find(r => r.id === id);
    if (reservation?.payment_status !== 'aprovado') {
      toast({ title: 'Pagamento pendente', description: 'A reserva só pode ser confirmada após pagamento aprovado.', variant: 'destructive' });
      return;
    }
    await supabase.from('reservations').update({ status: 'confirmada' } as any).eq('id', id);
    toast({ title: 'Reserva confirmada!' });
    setDetailOpen(null);
    fetch_();
  };

  const cancelReservation = async (id: string) => {
    await supabase.from('reservations').update({ status: 'cancelada' } as any).eq('id', id);
    toast({ title: 'Reserva cancelada!' });
    setDetailOpen(null);
    fetch_();
  };

  const sendWhatsApp = (reservation: any, type: 'payment' | 'contract') => {
    const link = type === 'payment'
      ? reservation.payment_link || `https://paypal.me/integracoworking/${reservation.total_value || 0}`
      : `${window.location.origin}/assinar?token=${reservation.contract_id || ''}`;
    const message = type === 'payment'
      ? `Olá! Segue o link de pagamento da sua reserva na sala "${reservation.rooms?.name}":\n\n💳 Valor: R$ ${Number(reservation.total_value).toFixed(2)}\n🔗 Link: ${link}\n\nInstituto Integra`
      : `Olá! Segue o link para assinatura do contrato:\n\n🔗 ${link}\n\nInstituto Integra`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
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
  const selectedDayReservations = selectedDate ? reservationsByDate[format(selectedDate, 'yyyy-MM-dd')] || [] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-display text-foreground">Reservas</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterRoom} onValueChange={setFilterRoom}>
              <SelectTrigger className="w-[180px] h-9"><SelectValue placeholder="Filtrar por sala" /></SelectTrigger>
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
                <div className="space-y-2"><Label>Valor Total (R$)</Label><Input type="number" value={form.total_value || ''} onChange={e => setForm({ ...form, total_value: Number(e.target.value) })} /></div>
                <div className="space-y-2"><Label>Observações</Label><Input value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
                <Button onClick={handleSave} className="w-full">Criar Reserva</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className="h-4 w-4" /></Button>
              <h2 className="text-base font-semibold capitalize">{format(currentMonth, 'MMMM yyyy', { locale: ptBR })}</h2>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className="h-4 w-4" /></Button>
            </div>
            <div className="grid grid-cols-7 border-b border-border/40">
              {dayNames.map(d => <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2.5">{d}</div>)}
            </div>
            <div className="grid grid-cols-7">
              {calendarDays.map((day, i) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayReservations = reservationsByDate[dateKey] || [];
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const today = isToday(day);
                const dayColor = isCurrentMonth ? getDayColor(dayReservations, allRooms) : '';
                const hasReservations = dayReservations.length > 0;

                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(day)}
                    className={`
                      relative min-h-[80px] p-2 border-b border-r border-border/20 text-left transition-all duration-200
                      ${!isCurrentMonth ? 'bg-muted/20 text-muted-foreground/40' : ''}
                      ${isCurrentMonth && !hasReservations ? 'bg-white hover:bg-muted/20' : ''}
                      ${isCurrentMonth && hasReservations ? `${dayColor} hover:opacity-80` : ''}
                      ${isSelected ? 'ring-2 ring-primary/50 z-10' : ''}
                    `}
                  >
                    <span className={`
                      text-xs font-semibold inline-flex items-center justify-center w-7 h-7 rounded-full
                      ${today ? 'bg-primary text-primary-foreground' : ''}
                    `}>
                      {format(day, 'd')}
                    </span>

                    {hasReservations && isCurrentMonth && (
                      <div className="mt-1 space-y-0.5">
                        <div className="text-[10px] font-semibold text-foreground/80">
                          {dayReservations.length} reserva{dayReservations.length > 1 ? 's' : ''}
                        </div>
                        {dayReservations.slice(0, 2).map((r: any) => (
                          <div key={r.id} className="text-[9px] leading-tight truncate text-foreground/60 font-medium">
                            {r.rooms?.name}
                          </div>
                        ))}
                        {dayReservations.length > 2 && (
                          <span className="text-[9px] text-foreground/50 font-medium">+{dayReservations.length - 2} mais</span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 mt-3 px-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-4 w-4 rounded border border-border bg-white" />
              <span>Livre</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-4 w-4 rounded bg-emerald-100 border border-emerald-300" />
              <span>Diária / Mensal</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-4 w-4 rounded bg-amber-100 border border-amber-300" />
              <span>Por Hora</span>
            </div>
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
            <h3 className="text-sm font-semibold mb-4">
              {selectedDate ? format(selectedDate, "dd 'de' MMMM, yyyy", { locale: ptBR }) : 'Selecione um dia'}
            </h3>
            {selectedDate && selectedDayReservations.length === 0 && (
              <div className="text-sm text-muted-foreground py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                  <Clock className="h-5 w-5 text-muted-foreground/50" />
                </div>
                <p className="font-medium">Nenhuma reserva neste dia</p>
                <p className="text-xs mt-1">Este dia está livre para novas reservas.</p>
                <Button variant="outline" size="sm" className="mt-4 gap-1.5"
                  onClick={() => { setForm({ ...form, date: format(selectedDate, 'yyyy-MM-dd'), status: 'pendente' }); setOpen(true); }}>
                  <Plus className="h-3.5 w-3.5" /> Reservar
                </Button>
              </div>
            )}
            <div className="space-y-3">
              {selectedDayReservations.map((r: any) => (
                <button key={r.id} onClick={() => setDetailOpen(r)} className="w-full text-left rounded-lg border border-border/40 p-4 hover:bg-muted/40 transition-colors space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{r.rooms?.name}</span>
                    <Badge variant="outline" className={`text-[10px] ${statusColors[r.status]}`}>{r.status}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {r.start_time?.slice(0, 5)} - {r.end_time?.slice(0, 5)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>{r.notes || 'Sem responsável informado'}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={`text-[9px] ${paymentColors[r.payment_status || 'pendente']}`}>
                      <CreditCard className="h-2.5 w-2.5 mr-0.5" /> {r.payment_status || 'pendente'}
                    </Badge>
                    <Badge variant="outline" className="text-[9px]">
                      R$ {Number(r.total_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </Badge>
                  </div>
                </button>
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

              <div className="flex items-center gap-3 flex-wrap">
                <div>
                  <span className="text-xs text-muted-foreground">Reserva:</span>
                  <Badge variant="outline" className={`ml-2 ${statusColors[detailOpen.status]}`}>{detailOpen.status}</Badge>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Pagamento:</span>
                  <Badge variant="outline" className={`ml-2 ${paymentColors[detailOpen.payment_status || 'pendente']}`}>{detailOpen.payment_status || 'pendente'}</Badge>
                </div>
              </div>

              {detailOpen.notes && <div><span className="text-sm text-muted-foreground">Observações:</span><p className="text-sm mt-1">{detailOpen.notes}</p></div>}

              <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground text-sm">Fluxo de confirmação:</p>
                <p className={detailOpen.payment_status === 'aprovado' ? 'text-primary' : ''}>
                  {detailOpen.payment_status === 'aprovado' ? '✅' : '⬜'} 1. Pagamento aprovado
                </p>
                <p className={detailOpen.status === 'confirmada' ? 'text-primary' : ''}>
                  {detailOpen.status === 'confirmada' ? '✅' : '⬜'} 2. Contrato assinado
                </p>
                <p className={detailOpen.status === 'confirmada' ? 'text-primary' : ''}>
                  {detailOpen.status === 'confirmada' ? '✅' : '⬜'} 3. Reserva confirmada
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                {detailOpen.payment_status !== 'aprovado' && detailOpen.status !== 'cancelada' && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => updatePaymentStatus(detailOpen.id, 'aprovado')} className="flex-1 gap-1">
                      <CreditCard className="h-3.5 w-3.5" /> Aprovar Pagamento
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => sendWhatsApp(detailOpen, 'payment')} className="gap-1">
                      <MessageCircle className="h-3.5 w-3.5" /> Enviar Link
                    </Button>
                  </div>
                )}
                {detailOpen.payment_status === 'aprovado' && detailOpen.status === 'pendente' && (
                  <Button size="sm" onClick={() => confirmReservation(detailOpen.id)} className="gap-1">
                    <FileSignature className="h-3.5 w-3.5" /> Confirmar Reserva
                  </Button>
                )}
                {detailOpen.status !== 'cancelada' && (
                  <Button size="sm" variant="destructive" onClick={() => cancelReservation(detailOpen.id)}>Cancelar Reserva</Button>
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
