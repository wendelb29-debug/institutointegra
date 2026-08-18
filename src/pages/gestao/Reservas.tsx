import { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Plus, ChevronLeft, ChevronRight, Clock, Filter, MessageCircle,
  CreditCard, User, CalendarDays, CheckCircle2, XCircle, Ban,
  AlertTriangle, Eye, Pencil
} from 'lucide-react';
import {
  startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths,
  format, isToday, isSameDay, getDay, parseISO, getDate
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RoomBlock {
  id: string;
  room_id: string | null;
  block_date: string;
  start_time: string | null;
  end_time: string | null;
  block_type: string;
  reason: string | null;
}

const statusColors: Record<string, string> = {
  confirmada: 'bg-emerald-500/15 text-emerald-700 border-emerald-300',
  pendente: 'bg-amber-500/15 text-amber-700 border-amber-300',
  cancelada: 'bg-red-500/15 text-red-700 border-red-300',
};

const statusBorderLeft: Record<string, string> = {
  confirmada: 'border-l-emerald-500',
  pendente: 'border-l-amber-500',
  cancelada: 'border-l-red-500',
};

const statusLabel: Record<string, string> = {
  confirmada: 'Confirmada',
  pendente: 'Pendente',
  cancelada: 'Cancelada',
};

const Reservas = () => {
  const [reservations, setReservations] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [allRooms, setAllRooms] = useState<any[]>([]);
  const [roomBlocks, setRoomBlocks] = useState<RoomBlock[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [filterRoom, setFilterRoom] = useState<string>('all');
  const [showNewReservation, setShowNewReservation] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [detailOpen, setDetailOpen] = useState<any>(null);
  const [editingReservation, setEditingReservation] = useState<any>(null);
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [form, setForm] = useState<any>({ status: 'pendente' });
  const [blockForm, setBlockForm] = useState<any>({ block_type: 'full_day', room_id: 'all', mode: 'single' });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [rRes, roomRes, allRoomRes, blocksRes] = await Promise.all([
        supabase.from('reservations').select('*, rooms(name, type), clients(name, phone)').order('date'),
        supabase.from('rooms').select('id, name, price_hour, price_day, price_month, type').eq('status', 'disponivel').order('name'),
        supabase.from('rooms').select('id, name, type').order('name'),
        supabase.from('room_blocks').select('*'),
      ]);
      setReservations(rRes.data || []);
      setRooms(roomRes.data || []);
      setAllRooms(allRoomRes.data || []);
      setRoomBlocks((blocksRes.data || []) as RoomBlock[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Realtime subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('reservas-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_blocks' }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  const filteredReservations = useMemo(() => {
    if (filterRoom === 'all') return reservations;
    return reservations.filter(r => r.room_id === filterRoom);
  }, [reservations, filterRoom]);

  const filteredBlocks = useMemo(() => {
    if (filterRoom === 'all') return roomBlocks;
    return roomBlocks.filter(b => !b.room_id || b.room_id === filterRoom);
  }, [roomBlocks, filterRoom]);

  const reservationsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    filteredReservations.forEach(r => {
      if (!map[r.date]) map[r.date] = [];
      map[r.date].push(r);
    });
    return map;
  }, [filteredReservations]);

  const blocksByDate = useMemo(() => {
    const map: Record<string, RoomBlock[]> = {};
    filteredBlocks.forEach(b => {
      if (!map[b.block_date]) map[b.block_date] = [];
      map[b.block_date].push(b);
    });
    return map;
  }, [filteredBlocks]);

  // Calendar data
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);

  const getDayStatus = (dateStr: string) => {
    const dayBlocks = blocksByDate[dateStr] || [];
    const dayRes = reservationsByDate[dateStr] || [];
    const isFullDayBlocked = dayBlocks.some(b => b.block_type === 'full_day' && !b.room_id);
    const activeRes = dayRes.filter(r => r.status !== 'cancelada');

    if (isFullDayBlocked) return 'blocked';
    if (activeRes.length === 0) return 'free';
    // Consider "full" if there are many reservations (simplified heuristic)
    const totalRooms = filterRoom === 'all' ? allRooms.length : 1;
    if (activeRes.length >= totalRooms * 8) return 'full'; // rough: 8h slots per room
    return 'partial';
  };

  const dayStatusStyles: Record<string, string> = {
    blocked: 'bg-red-100 border-red-300 dark:bg-red-950/30',
    full: 'bg-blue-100 border-blue-300 dark:bg-blue-950/30',
    partial: 'bg-amber-100 border-amber-300 dark:bg-amber-950/30',
    free: '',
  };

  // Save reservation
  const handleSave = async () => {
    if (!form.room_id || !form.date || !form.start_time || !form.end_time) {
      toast({ title: 'Erro', description: 'Preencha todos os campos obrigatórios.', variant: 'destructive' });
      return;
    }

    // Conflict check
    const dateStr = form.date;
    const dateBlocks = roomBlocks.filter(b => b.block_date === dateStr && (!b.room_id || b.room_id === form.room_id));
    const isBlocked = dateBlocks.some(b => {
      if (b.block_type === 'full_day') return true;
      if (!b.start_time || !b.end_time) return false;
      return form.start_time < b.end_time && form.end_time > b.start_time;
    });
    if (isBlocked) {
      toast({ title: 'Horário bloqueado', description: 'Este horário está bloqueado.', variant: 'destructive' });
      return;
    }

    const conflicting = reservations.filter(r =>
      r.date === dateStr && r.room_id === form.room_id && r.status !== 'cancelada' &&
      form.start_time < r.end_time && form.end_time > r.start_time
    );
    if (conflicting.length > 0) {
      toast({ title: 'Conflito', description: 'Já existe reserva neste horário para esta sala.', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('reservations').insert({
      room_id: form.room_id,
      date: form.date,
      start_time: form.start_time,
      end_time: form.end_time,
      status: 'pendente',
      user_id: user?.id,
      total_value: form.total_value || 0,
      notes: form.notes,
      client_id: form.client_id || null,
      payment_status: 'pendente',
    } as any);

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      // Trigger webhook manually or wait for trigger? 
      // The instructions say "After saving: feedback...". 
      // Triggers don't return JSON to frontend easily. 
      // We should invoke it manually if we want immediate feedback.
      try {
        const { data: newRes } = await supabase.from('reservations').select('*').eq('user_id', user?.id).order('created_at', { ascending: false }).limit(1).single();
        if (newRes) {
          const { data: webhookRes } = await supabase.functions.invoke('reservations-webhook', {
            body: { record: newRes, type: 'INSERT' }
          });
          if (webhookRes?.feedback) {
            toast({ title: 'Sucesso', description: webhookRes.feedback });
          } else {
            toast({ title: 'Reserva criada!' });
          }
        }
      } catch (e) {
        toast({ title: 'Reserva criada!', description: 'Não foi possível disparar notificações.' });
      }
      
      setShowNewReservation(false);
      setForm({ status: 'pendente' });
      fetchData();
    }
  };
  
  const handleUpdate = async () => {
    if (!form.id || !form.room_id || !form.date || !form.start_time || !form.end_time) {
      toast({ title: 'Erro', description: 'Preencha todos os campos obrigatórios.', variant: 'destructive' });
      return;
    }

    const dateStr = form.date;
    
    // Conflict check (excluding current reservation)
    const dateBlocks = roomBlocks.filter(b => b.block_date === dateStr && (!b.room_id || b.room_id === form.room_id));
    const isBlocked = dateBlocks.some(b => {
      if (b.block_type === 'full_day') return true;
      if (!b.start_time || !b.end_time) return false;
      return form.start_time < b.end_time && form.end_time > b.start_time;
    });
    
    if (isBlocked) {
      toast({ title: 'Horário bloqueado', description: 'Este horário já está reservado ou bloqueado para esta sala. Escolha outro horário.', variant: 'destructive' });
      return;
    }

    const conflicting = reservations.filter(r =>
      r.id !== form.id &&
      r.date === dateStr && 
      r.room_id === form.room_id && 
      r.status !== 'cancelada' &&
      form.start_time < r.end_time && 
      form.end_time > r.start_time
    );

    if (conflicting.length > 0) {
      toast({ title: 'Conflito', description: 'Este horário já está reservado ou bloqueado para esta sala. Escolha outro horário.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('reservations').update({
        room_id: form.room_id,
        date: form.date,
        start_time: form.start_time,
        end_time: form.end_time,
        status: form.status,
        total_value: form.total_value || 0,
        notes: form.notes,
        client_id: form.client_id || null,
        updated_at: new Date().toISOString(),
      } as any).eq('id', form.id);

      if (error) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      } else {
        try {
          const { data: updatedRes } = await supabase.from('reservations').select('*').eq('id', form.id).single();
          const { data: webhookRes } = await supabase.functions.invoke('reservations-webhook', {
            body: { record: updatedRes, type: 'UPDATE', old_record: reservations.find(r => r.id === form.id) }
          });
          if (webhookRes?.feedback) {
            toast({ title: 'Sucesso', description: webhookRes.feedback });
          } else {
            toast({ title: 'Reserva atualizada com sucesso.' });
          }
        } catch (e) {
          toast({ title: 'Reserva atualizada!', description: 'Não foi possível disparar notificações.' });
        }
        
        setEditingReservation(null);
        setForm({ status: 'pendente' });
        fetchData();
      }
    } finally {
      setLoading(false);
    }
  };

  // Block handling
  const handleSaveBlock = async () => {
    const dates: string[] = [];
    if (blockForm.mode === 'single') {
      if (!blockForm.date) return;
      dates.push(blockForm.date);
    } else {
      if (!blockForm.date || !blockForm.date_end) return;
      const range = eachDayOfInterval({ start: parseISO(blockForm.date), end: parseISO(blockForm.date_end) });
      const filtered = range.filter(d => {
        const dayNum = getDate(d);
        if (blockForm.dayFilter === 'odd') return dayNum % 2 !== 0;
        if (blockForm.dayFilter === 'even') return dayNum % 2 === 0;
        return true;
      });
      filtered.forEach(d => dates.push(format(d, 'yyyy-MM-dd')));
    }

    if (dates.length === 0) return;

    const rows = dates.map(d => ({
      room_id: blockForm.room_id === 'all' ? null : blockForm.room_id,
      block_date: d,
      block_type: blockForm.block_type,
      start_time: blockForm.block_type === 'partial' ? blockForm.start_time : null,
      end_time: blockForm.block_type === 'partial' ? blockForm.end_time : null,
      reason: blockForm.reason || null,
      created_by: user?.id,
    }));

    const { error } = await supabase.from('room_blocks').insert(rows as any);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Bloqueio criado!', description: `${dates.length} dia(s) bloqueado(s).` });
      setShowBlockDialog(false);
      setBlockForm({ block_type: 'full_day', room_id: 'all', mode: 'single' });
      fetchData();
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const oldRecord = reservations.find(r => r.id === id);
    const { error } = await supabase.from('reservations').update({ status } as any).eq('id', id);
    
    if (!error) {
      try {
        const { data: updatedRes } = await supabase.from('reservations').select('*').eq('id', id).single();
        const { data: webhookRes } = await supabase.functions.invoke('reservations-webhook', {
          body: { record: updatedRes, type: 'UPDATE', old_record: oldRecord }
        });
        if (webhookRes?.feedback) {
          toast({ title: 'Sucesso', description: webhookRes.feedback });
        } else {
          toast({ title: `Reserva ${status}!` });
        }
      } catch (e) {
        toast({ title: `Reserva ${status}!`, description: 'Não foi possível disparar notificações.' });
      }
    } else {
      toast({ title: 'Erro ao atualizar status', variant: 'destructive' });
    }
    fetchData();
  };

  const removeBlock = async (id: string) => {
    await supabase.from('room_blocks').delete().eq('id', id);
    toast({ title: 'Bloqueio removido!' });
    fetchData();
  };

  const fetchEmailLogs = async (resId: string) => {
    const { data } = await supabase.from('email_logs').select('*').eq('reservation_id', resId).order('sent_at', { ascending: false });
    setEmailLogs(data || []);
  };

  const handleResendEmail = async (res: any) => {
    setSendingEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke('reservations-webhook', {
        body: { record: res, type: 'UPDATE', manual_recipient: res.clients?.email || user?.email }
      });
      if (error) throw error;
      toast({ title: 'Notificação reenviada', description: data?.feedback || 'E-mail enviado com sucesso.' });
      fetchEmailLogs(res.id);
    } catch (err: any) {
      toast({ title: 'Erro ao reenviar', description: 'Não foi possível enviar o e-mail de confirmação.', variant: 'destructive' });
    } finally {
      setSendingEmail(false);
    }
  };

  // Selected day data
  const selectedDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  const selectedDayRes = useMemo(() =>
    (reservationsByDate[selectedDateStr] || []).sort((a: any, b: any) => (a.start_time || '').localeCompare(b.start_time || '')),
    [reservationsByDate, selectedDateStr]
  );
  const selectedDayBlocks = blocksByDate[selectedDateStr] || [];
  const isSelectedDayBlocked = selectedDayBlocks.some(b => b.block_type === 'full_day' && !b.room_id);
  const confirmedCount = selectedDayRes.filter((r: any) => r.status === 'confirmada').length;
  const cancelledCount = selectedDayRes.filter((r: any) => r.status === 'cancelada').length;
  const pendingCount = selectedDayRes.filter((r: any) => r.status === 'pendente').length;

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-display text-foreground">Reservas</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Calendário inteligente de gestão de salas</p>
          </div>
          <div className="flex gap-2 flex-wrap">
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
            <Button variant="outline" className="gap-1.5" onClick={() => {
              setBlockForm({ block_type: 'full_day', room_id: 'all', mode: 'single', date: selectedDateStr });
              setShowBlockDialog(true);
            }}>
              <Ban className="h-4 w-4" /> Bloquear Agenda
            </Button>
            <Button className="gap-1.5" onClick={() => {
              setForm({ status: 'pendente', date: selectedDateStr });
              setShowNewReservation(true);
            }}>
              <Plus className="h-4 w-4" /> Nova Reserva
            </Button>
          </div>
        </div>

        {/* Calendar */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-base capitalize">
                {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid grid-cols-7 gap-1">
                {Array(35).fill(0).map((_, i) => (
                  <Skeleton key={i} className="min-h-[72px] rounded-lg bg-gold/5" />
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                    <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: startDayOfWeek }).map((_, i) => <div key={`e-${i}`} />)}
                  {daysInMonth.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const dayRes = reservationsByDate[dateStr] || [];
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const today = isToday(day);
                    const status = getDayStatus(dateStr);
                    const activeRes = dayRes.filter((r: any) => r.status !== 'cancelada');
                    const cancelledRes = dayRes.filter((r: any) => r.status === 'cancelada');

                    return (
                      <Tooltip key={dateStr}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => setSelectedDate(day)}
                            className={`relative rounded-lg text-sm transition-all min-h-[72px] flex flex-col items-start p-1.5 gap-0.5 border
                              ${isSelected ? 'bg-primary text-primary-foreground ring-2 ring-primary/30 border-primary' : ''}
                              ${!isSelected && today ? 'bg-accent font-bold border-accent' : ''}
                              ${!isSelected && !today ? `${dayStatusStyles[status]} hover:opacity-80 border-transparent` : ''}
                              ${!isSelected && !today && status === 'free' ? 'hover:bg-muted/50 border-border/30' : ''}
                            `}
                          >
                            <div className="flex items-center gap-0.5 w-full">
                              <span className="text-xs font-semibold">{format(day, 'd')}</span>
                              {status === 'blocked' && !isSelected && <Ban className="h-2.5 w-2.5 ml-auto text-red-500" />}
                            </div>
                            {activeRes.length > 0 && (
                              <div className={`text-[10px] font-medium ${isSelected ? 'text-primary-foreground/80' : 'text-foreground/70'}`}>
                                {activeRes.length} reserva{activeRes.length > 1 ? 's' : ''}
                              </div>
                            )}
                            {activeRes.slice(0, 2).map((r: any) => (
                              <div
                                key={r.id}
                                className={`w-full rounded px-1 py-0.5 text-[9px] leading-tight truncate
                                  ${isSelected ? 'bg-primary-foreground/20 text-primary-foreground' :
                                    r.status === 'confirmada' ? 'bg-emerald-500/20 text-emerald-800' :
                                    r.status === 'cancelada' ? 'bg-red-500/20 text-red-800' :
                                    'bg-amber-500/20 text-amber-800'}
                                `}
                              >
                                {r.start_time?.slice(0, 5)} {r.rooms?.name?.split(' ')[0]}
                              </div>
                            ))}
                            {activeRes.length > 2 && (
                              <span className={`text-[9px] ${isSelected ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                                +{activeRes.length - 2} mais
                              </span>
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          <p className="font-semibold">{format(day, "dd/MM/yyyy")}</p>
                          {status === 'blocked' && <p className="text-red-500">🔴 Dia bloqueado</p>}
                          {activeRes.length > 0 && <p>{activeRes.length} reserva(s) ativa(s)</p>}
                          {cancelledRes.length > 0 && <p className="text-red-500">{cancelledRes.length} cancelamento(s)</p>}
                          {activeRes.length === 0 && status !== 'blocked' && <p className="text-emerald-600">🟢 Dia livre</p>}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 mt-3 flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="h-3.5 w-3.5 rounded border border-border bg-background" /> Livre
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="h-3.5 w-3.5 rounded bg-amber-100 border border-amber-300" /> Parcial
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="h-3.5 w-3.5 rounded bg-blue-100 border border-blue-300" /> Ocupado
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="h-3.5 w-3.5 rounded bg-red-100 border border-red-300" /> Bloqueado
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Smart Day Panel */}
        {selectedDate && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="text-base capitalize">
                    {format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </CardTitle>
                  {isSelectedDayBlocked && (
                    <div className="flex items-center gap-1.5 mt-1.5 text-destructive text-xs font-medium">
                      <Ban className="h-3.5 w-3.5" />
                      Agenda bloqueada neste dia
                    </div>
                  )}
                </div>
                {!isSelectedDayBlocked && (
                  <Button
                    size="sm"
                    className="gap-1.5"
                    onClick={() => {
                      setForm({ status: 'pendente', date: selectedDateStr });
                      setShowNewReservation(true);
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" /> Nova Reserva
                  </Button>
                )}
              </div>
              {/* Summary badges */}
              <div className="flex gap-2 mt-2 flex-wrap">
                <Badge variant="outline" className="text-xs gap-1">
                  <CalendarDays className="h-3 w-3" /> {selectedDayRes.length} reserva(s)
                </Badge>
                {confirmedCount > 0 && (
                  <Badge variant="outline" className="text-xs gap-1 bg-emerald-500/10 text-emerald-700 border-emerald-200">
                    <CheckCircle2 className="h-3 w-3" /> {confirmedCount} confirmada(s)
                  </Badge>
                )}
                {pendingCount > 0 && (
                  <Badge variant="outline" className="text-xs gap-1 bg-amber-500/10 text-amber-700 border-amber-200">
                    <Clock className="h-3 w-3" /> {pendingCount} pendente(s)
                  </Badge>
                )}
                {cancelledCount > 0 && (
                  <Badge variant="outline" className="text-xs gap-1 bg-red-500/10 text-red-700 border-red-200">
                    <XCircle className="h-3 w-3" /> {cancelledCount} cancelada(s)
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Blocks info */}
              {selectedDayBlocks.map(b => (
                <div key={b.id} className="flex items-center justify-between p-2.5 rounded-lg bg-red-50 dark:bg-red-950/20 text-xs border border-dashed border-red-200">
                  <div className="flex items-center gap-2 text-red-700">
                    <Ban className="h-3.5 w-3.5" />
                    <span>
                      {b.block_type === 'full_day'
                        ? `Bloqueio dia inteiro${b.room_id ? ` · ${allRooms.find(r => r.id === b.room_id)?.name || 'Sala'}` : ' · Todas as salas'}`
                        : `Bloqueio: ${b.start_time?.slice(0, 5)} - ${b.end_time?.slice(0, 5)}${b.room_id ? ` · ${allRooms.find(r => r.id === b.room_id)?.name || 'Sala'}` : ''}`}
                      {b.reason && ` · ${b.reason}`}
                    </span>
                  </div>
                  <Button size="sm" variant="ghost" className="h-6 text-xs text-red-600 hover:text-red-800" onClick={() => removeBlock(b.id)}>
                    Remover
                  </Button>
                </div>
              ))}

              {/* Empty state */}
              {selectedDayRes.length === 0 && selectedDayBlocks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhuma reserva neste dia</p>
                  <p className="text-xs mt-1">Este dia está livre para novas reservas.</p>
                </div>
              )}

              {/* Reservations list */}
              {selectedDayRes.map((r: any) => {
                const roomType = r.rooms?.type;
                const typeLabel = roomType === 'hora' ? 'Por hora' : roomType === 'diaria' ? 'Diária' : roomType === 'mensal' ? 'Mensal' : roomType;

                return (
                  <div
                    key={r.id}
                    className={`rounded-lg border border-l-4 p-3 transition-all hover:shadow-sm ${statusBorderLeft[r.status] || 'border-l-muted'}`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">
                          {r.start_time?.slice(0, 5)} - {r.end_time?.slice(0, 5)}
                        </span>
                        <Badge variant="outline" className="text-[10px]">{r.rooms?.name}</Badge>
                        {typeLabel && <Badge variant="secondary" className="text-[10px]">{typeLabel}</Badge>}
                      </div>
                      <Badge variant="outline" className={`text-[10px] ${statusColors[r.status]}`}>
                        {statusLabel[r.status]}
                      </Badge>
                    </div>
                    <p className="text-sm font-semibold mb-0.5">
                      {r.clients?.name || r.notes || 'Sem cliente informado'}
                    </p>
                    {r.total_value > 0 && (
                      <p className="text-xs text-muted-foreground mb-2">
                        R$ {Number(r.total_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    )}
                    {/* Quick actions */}
                    <div className="flex gap-1.5 flex-wrap">
                      {r.status === 'pendente' && (
                        <Button
                          size="sm" variant="outline"
                          className="h-7 text-xs gap-1 bg-emerald-500/10 text-emerald-700 border-emerald-200 hover:bg-emerald-500/20"
                          onClick={() => updateStatus(r.id, 'confirmada')}
                        >
                          <CheckCircle2 className="h-3 w-3" /> Confirmar
                        </Button>
                      )}
                      {r.status !== 'cancelada' && (
                        <Button
                          size="sm" variant="outline"
                          className="h-7 text-xs gap-1 bg-red-500/10 text-red-700 border-red-200 hover:bg-red-500/20"
                          onClick={() => updateStatus(r.id, 'cancelada')}
                        >
                          <XCircle className="h-3 w-3" /> Cancelar
                        </Button>
                      )}
                      <Button
                        size="sm" variant="outline"
                        className="h-7 text-xs gap-1"
                        onClick={() => {
                          setForm({ ...r });
                          setEditingReservation(r);
                        }}
                      >
                        <Pencil className="h-3 w-3" /> Editar
                      </Button>
                      <Button
                        size="sm" variant="outline"
                        className="h-7 text-xs gap-1"
                        onClick={() => setDetailOpen(r)}
                      >
                        <Eye className="h-3 w-3" /> Detalhes
                      </Button>
                      {(r.clients?.phone || r.notes) && (
                        <Button
                          size="sm" variant="outline"
                          className="h-7 text-xs gap-1 bg-emerald-500/5 text-emerald-700 border-emerald-200 hover:bg-emerald-500/15"
                          onClick={() => {
                            const phone = (r.clients?.phone || '').replace(/\D/g, '');
                            if (phone) window.open(`https://wa.me/${phone}`, '_blank');
                          }}
                        >
                          <MessageCircle className="h-3 w-3" /> WhatsApp
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* New Reservation Dialog */}
        <Dialog open={showNewReservation} onOpenChange={setShowNewReservation}>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Reserva</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Sala *</Label>
                <Select value={form.room_id || ''} onValueChange={v => setForm({ ...form, room_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{rooms.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data *</Label>
                <Input type="date" value={form.date || ''} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Início *</Label><Input type="time" value={form.start_time || ''} onChange={e => setForm({ ...form, start_time: e.target.value })} /></div>
                <div><Label>Fim *</Label><Input type="time" value={form.end_time || ''} onChange={e => setForm({ ...form, end_time: e.target.value })} /></div>
              </div>
              <div>
                <Label>Valor Total (R$)</Label>
                <Input type="number" value={form.total_value || ''} onChange={e => setForm({ ...form, total_value: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Observações / Cliente</Label>
                <Textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Nome do cliente ou observações" />
              </div>
              <Button onClick={handleSave} className="w-full">Criar Reserva</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Reservation Dialog */}
        <Dialog open={!!editingReservation} onOpenChange={(open) => !open && setEditingReservation(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Editar Reserva</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Status da Reserva</Label>
                <Select value={form.status || 'pendente'} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="confirmada">Confirmada</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Sala *</Label>
                <Select value={form.room_id || ''} onValueChange={v => setForm({ ...form, room_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{allRooms.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data *</Label>
                <Input type="date" value={form.date || ''} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Início *</Label><Input type="time" value={form.start_time || ''} onChange={e => setForm({ ...form, start_time: e.target.value })} /></div>
                <div><Label>Fim *</Label><Input type="time" value={form.end_time || ''} onChange={e => setForm({ ...form, end_time: e.target.value })} /></div>
              </div>
              <div>
                <Label>Valor Total (R$)</Label>
                <Input type="number" value={form.total_value || ''} onChange={e => setForm({ ...form, total_value: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Observações / Cliente</Label>
                <Textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Nome do cliente ou observações" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditingReservation(null)} className="flex-1">Cancelar</Button>
                <Button onClick={handleUpdate} className="flex-1" disabled={loading}>
                  {loading ? 'Salvando...' : 'Salvar alterações'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Block Dialog */}
        <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Bloquear Agenda</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Sala</Label>
                <Select value={blockForm.room_id} onValueChange={v => setBlockForm({ ...blockForm, room_id: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as salas</SelectItem>
                    {allRooms.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Modo</Label>
                <Select value={blockForm.mode} onValueChange={v => setBlockForm({ ...blockForm, mode: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Dia único</SelectItem>
                    <SelectItem value="range">Múltiplos dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{blockForm.mode === 'range' ? 'Data Inicial' : 'Data'} *</Label>
                <Input type="date" value={blockForm.date || ''} onChange={e => setBlockForm({ ...blockForm, date: e.target.value })} />
              </div>

              {blockForm.mode === 'range' && (
                <>
                  <div>
                    <Label>Data Final *</Label>
                    <Input type="date" value={blockForm.date_end || ''} onChange={e => setBlockForm({ ...blockForm, date_end: e.target.value })} />
                  </div>
                  <div>
                    <Label>Filtro de dias</Label>
                    <Select value={blockForm.dayFilter || 'all'} onValueChange={v => setBlockForm({ ...blockForm, dayFilter: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os dias</SelectItem>
                        <SelectItem value="odd">Apenas dias ímpares</SelectItem>
                        <SelectItem value="even">Apenas dias pares</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div>
                <Label>Tipo de bloqueio</Label>
                <Select value={blockForm.block_type} onValueChange={v => setBlockForm({ ...blockForm, block_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_day">Dia inteiro</SelectItem>
                    <SelectItem value="partial">Horário específico</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {blockForm.block_type === 'partial' && (
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Início</Label><Input type="time" value={blockForm.start_time || ''} onChange={e => setBlockForm({ ...blockForm, start_time: e.target.value })} /></div>
                  <div><Label>Fim</Label><Input type="time" value={blockForm.end_time || ''} onChange={e => setBlockForm({ ...blockForm, end_time: e.target.value })} /></div>
                </div>
              )}

              <div>
                <Label>Motivo (opcional)</Label>
                <Input value={blockForm.reason || ''} onChange={e => setBlockForm({ ...blockForm, reason: e.target.value })} placeholder="Ex: manutenção, limpeza" />
              </div>

              <Button onClick={handleSaveBlock} className="w-full">Bloquear</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Reservation Detail Dialog */}
        <Dialog open={!!detailOpen} onOpenChange={(open) => {
          if (!open) setDetailOpen(null);
          else if (detailOpen?.id) fetchEmailLogs(detailOpen.id);
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Detalhes da Reserva</DialogTitle></DialogHeader>
            {detailOpen && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Sala:</span><p className="font-medium">{detailOpen.rooms?.name}</p></div>
                  <div><span className="text-muted-foreground">Data:</span><p className="font-medium">{new Date(detailOpen.date + 'T12:00:00').toLocaleDateString('pt-BR')}</p></div>
                  <div><span className="text-muted-foreground">Horário:</span><p className="font-medium">{detailOpen.start_time?.slice(0, 5)} - {detailOpen.end_time?.slice(0, 5)}</p></div>
                  <div><span className="text-muted-foreground">Valor:</span><p className="font-medium tabular-nums">R$ {Number(detailOpen.total_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <div>
                    <span className="text-xs text-muted-foreground">Reserva:</span>
                    <Badge variant="outline" className={`ml-2 ${statusColors[detailOpen.status]}`}>{statusLabel[detailOpen.status]}</Badge>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Pagamento:</span>
                    <Badge variant="outline" className="ml-2">{detailOpen.payment_status || 'pendente'}</Badge>
                  </div>
                </div>
                {detailOpen.notes && <div><span className="text-sm text-muted-foreground">Observações:</span><p className="text-sm mt-1">{detailOpen.notes}</p></div>}
                
                <div className="pt-2 space-y-3">
                  <div className="rounded-lg border border-border p-3 bg-muted/30">
                    <h4 className="text-xs font-semibold mb-2 flex items-center gap-1.5 uppercase tracking-wider text-muted-foreground">
                      Comunicações
                    </h4>
                    {emailLogs.length > 0 ? (
                      <div className="space-y-2 mb-3">
                        <div className="flex justify-between items-start text-[11px]">
                          <div>
                            <p className="text-muted-foreground">Último e-mail: <span className="text-foreground">{emailLogs[0].status === 'sent' ? 'Enviado' : 'Falhou'}</span></p>
                            <p className="text-muted-foreground">Destinatário: <span className="text-foreground">{emailLogs[0].recipient}</span></p>
                            <p className="text-muted-foreground">Data: <span className="text-foreground">{format(new Date(emailLogs[0].sent_at), "dd/MM/yyyy HH:mm")}</span></p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-muted-foreground mb-3">Nenhum e-mail enviado recentemente.</p>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-xs h-8 gap-1.5"
                      onClick={() => handleResendEmail(detailOpen)}
                      disabled={sendingEmail}
                    >
                      {sendingEmail ? 'Enviando...' : 'Reenviar e-mail'}
                    </Button>
                  </div>

                  <div className="flex flex-col gap-2">
                    {detailOpen.status === 'pendente' && (
                      <Button size="sm" onClick={() => { updateStatus(detailOpen.id, 'confirmada'); setDetailOpen(null); }} className="gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Confirmar Reserva
                      </Button>
                    )}
                    {detailOpen.status !== 'cancelada' && (
                      <Button size="sm" variant="destructive" onClick={() => { updateStatus(detailOpen.id, 'cancelada'); setDetailOpen(null); }}>
                        Cancelar Reserva
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default Reservas;
