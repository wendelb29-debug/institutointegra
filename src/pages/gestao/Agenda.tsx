import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  CalendarDays, Plus, Users, Clock, Phone, Mail, Settings,
  CheckCircle2, XCircle, Send
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Agenda components
import { AgendaStats } from '@/components/agenda/AgendaStats';
import { MonthCalendar } from '@/components/agenda/MonthCalendar';
import { DayView } from '@/components/agenda/DayView';
import { WeekView } from '@/components/agenda/WeekView';
import { AppointmentQuickView } from '@/components/agenda/AppointmentQuickView';
import { BlockTimeDialog } from '@/components/agenda/BlockTimeDialog';
import { ScheduleSettingsDialog } from '@/components/agenda/ScheduleSettingsDialog';

interface Patient {
  id: string;
  name: string;
  phone: string;
  email?: string;
  cpf?: string;
  notes?: string;
}

interface Appointment {
  id: string;
  patient_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: 'agendado' | 'confirmado' | 'cancelado' | 'realizado';
  notes?: string;
  reminder_sent: boolean;
  patients?: { name: string; phone: string };
}

interface ScheduleBlock {
  id: string;
  block_date: string;
  start_time: string | null;
  end_time: string | null;
  block_type: string;
  reason: string | null;
}

interface ScheduleSettings {
  work_start_time: string;
  work_end_time: string;
  slot_duration_minutes: number;
  break_duration_minutes: number;
  working_days: number[];
}

type ViewMode = 'month' | 'week' | 'day';

const Agenda = () => {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [settings, setSettings] = useState<ScheduleSettings>({
    work_start_time: '08:00',
    work_end_time: '18:00',
    slot_duration_minutes: 50,
    break_duration_minutes: 10,
    working_days: [1, 2, 3, 4, 5],
  });
  const [loading, setLoading] = useState(true);
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [activeTab, setActiveTab] = useState('agenda');
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [quickViewAppt, setQuickViewAppt] = useState<Appointment | null>(null);
  const [showQuickView, setShowQuickView] = useState(false);

  // New appointment form
  const [newAppt, setNewAppt] = useState({ patient_id: '', date: '', start_time: '', end_time: '', notes: '' });
  // New patient form
  const [newPatient, setNewPatient] = useState({ name: '', phone: '', email: '', cpf: '', notes: '' });

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [patientsRes, appointmentsRes, blocksRes, settingsRes] = await Promise.all([
        supabase.from('patients').select('*').eq('psychologist_id', user.id).order('name'),
        supabase.from('appointments').select('*, patients(name, phone)').eq('psychologist_id', user.id).order('appointment_date'),
        supabase.from('schedule_blocks').select('*').eq('psychologist_id', user.id),
        supabase.from('schedule_settings').select('*').eq('psychologist_id', user.id).single(),
      ]);
      if (patientsRes.data) setPatients(patientsRes.data);
      if (appointmentsRes.data) setAppointments(appointmentsRes.data as unknown as Appointment[]);
      if (blocksRes.data) setBlocks(blocksRes.data as unknown as ScheduleBlock[]);
      if (settingsRes.data) {
        const s = settingsRes.data;
        setSettings({
          work_start_time: (s.work_start_time as string)?.slice(0, 5) || '08:00',
          work_end_time: (s.work_end_time as string)?.slice(0, 5) || '18:00',
          slot_duration_minutes: s.slot_duration_minutes || 50,
          break_duration_minutes: s.break_duration_minutes || 10,
          working_days: s.working_days || [1, 2, 3, 4, 5],
        });
      }
    } catch {
      toast({ title: 'Erro', description: 'Erro ao carregar dados.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleCreatePatient = async () => {
    if (!user || !newPatient.name || !newPatient.phone) {
      toast({ title: 'Erro', description: 'Nome e telefone são obrigatórios.', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('patients').insert({
      psychologist_id: user.id,
      name: newPatient.name,
      phone: newPatient.phone,
      email: newPatient.email || null,
      cpf: newPatient.cpf || null,
      notes: newPatient.notes || null,
    });
    if (error) {
      toast({ title: 'Erro', description: 'Erro ao criar paciente.', variant: 'destructive' });
    } else {
      toast({ title: 'Sucesso', description: 'Paciente cadastrado.' });
      setNewPatient({ name: '', phone: '', email: '', cpf: '', notes: '' });
      setShowNewPatient(false);
      setActiveTab('pacientes');
      fetchData();
    }
  };

  const handleCreateAppointment = async () => {
    if (!user || !newAppt.patient_id || !newAppt.date || !newAppt.start_time || !newAppt.end_time) {
      toast({ title: 'Erro', description: 'Preencha todos os campos obrigatórios.', variant: 'destructive' });
      return;
    }

    // Check for blocks
    const dateBlocks = blocks.filter(b => b.block_date === newAppt.date);
    const isBlocked = dateBlocks.some(b => {
      if (b.block_type === 'full_day') return true;
      if (!b.start_time || !b.end_time) return false;
      const newStart = newAppt.start_time;
      const newEnd = newAppt.end_time;
      return newStart < b.end_time && newEnd > b.start_time;
    });

    if (isBlocked) {
      toast({ title: 'Horário bloqueado', description: 'Este horário está bloqueado na agenda.', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('appointments').insert({
      psychologist_id: user.id,
      patient_id: newAppt.patient_id,
      appointment_date: newAppt.date,
      start_time: newAppt.start_time,
      end_time: newAppt.end_time,
      notes: newAppt.notes || null,
    });
    if (error) {
      toast({ title: 'Erro', description: 'Erro ao agendar consulta.', variant: 'destructive' });
    } else {
      toast({ title: 'Sucesso', description: 'Consulta agendada!' });
      const patient = patients.find(p => p.id === newAppt.patient_id);
      if (patient) sendWhatsAppNotification(patient, newAppt.date, newAppt.start_time);
      setNewAppt({ patient_id: '', date: '', start_time: '', end_time: '', notes: '' });
      setShowNewAppointment(false);
      fetchData();
    }
  };

  const sendWhatsAppNotification = async (patient: Patient, date: string, time: string) => {
    try {
      const { data: config } = await supabase
        .from('psychologist_whatsapp_config')
        .select('*')
        .eq('psychologist_id', user!.id)
        .single();
      if (!config) return;
      const formattedDate = format(new Date(date + 'T12:00:00'), "dd/MM/yyyy", { locale: ptBR });
      const message = `Olá ${patient.name}, sua consulta foi agendada para ${formattedDate} às ${time}. Instituto Integra.`;
      await supabase.functions.invoke('zapi-proxy', {
        body: { action: 'send', phone: patient.phone, message, instanceId: config.instance_id, token: config.token, clientToken: config.client_token }
      });
    } catch { /* silent */ }
  };

  const updateAppointmentStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('appointments').update({ status } as any).eq('id', id);
    if (error) {
      toast({ title: 'Erro', description: 'Erro ao atualizar status.', variant: 'destructive' });
    } else {
      fetchData();
    }
  };

  const todayAppointments = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    return appointments.filter(a => a.appointment_date === todayStr);
  }, [appointments]);

  // Auto-calculate end time
  const handleStartTimeChange = (time: string) => {
    setNewAppt(p => {
      const [h, m] = time.split(':').map(Number);
      const totalMin = h * 60 + m + settings.slot_duration_minutes;
      const endH = Math.floor(totalMin / 60);
      const endM = totalMin % 60;
      const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
      return { ...p, start_time: time, end_time: endTime };
    });
  };

  const handleAppointmentClick = (appt: Appointment) => {
    setQuickViewAppt(appt);
    setShowQuickView(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-display text-foreground">Agenda</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Gerencie consultas e pacientes</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {user && <BlockTimeDialog userId={user.id} selectedDate={selectedDate} onBlockCreated={fetchData} />}
          {user && <ScheduleSettingsDialog userId={user.id} onSettingsChange={fetchData} />}

          <Dialog open={showNewPatient} onOpenChange={setShowNewPatient}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-1.5">
                <Users className="h-4 w-4" /> Novo Paciente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Cadastrar Paciente</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Nome *</Label><Input value={newPatient.name} onChange={e => setNewPatient(p => ({ ...p, name: e.target.value }))} /></div>
                <div><Label>Telefone *</Label><Input value={newPatient.phone} onChange={e => setNewPatient(p => ({ ...p, phone: e.target.value }))} placeholder="5511999990000" /></div>
                <div><Label>Email</Label><Input value={newPatient.email} onChange={e => setNewPatient(p => ({ ...p, email: e.target.value }))} /></div>
                <div><Label>CPF</Label><Input value={newPatient.cpf} onChange={e => setNewPatient(p => ({ ...p, cpf: e.target.value }))} /></div>
                <div><Label>Observações</Label><Textarea value={newPatient.notes} onChange={e => setNewPatient(p => ({ ...p, notes: e.target.value }))} /></div>
                <Button onClick={handleCreatePatient} className="w-full">Cadastrar</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showNewAppointment} onOpenChange={setShowNewAppointment}>
            <DialogTrigger asChild>
              <Button className="gap-1.5">
                <Plus className="h-4 w-4" /> Nova Consulta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Agendar Consulta</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Paciente *</Label>
                  <Select value={newAppt.patient_id} onValueChange={v => setNewAppt(p => ({ ...p, patient_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {patients.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Data *</Label>
                  <Input type="date" value={newAppt.date} onChange={e => setNewAppt(p => ({ ...p, date: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Início *</Label>
                    <Input type="time" value={newAppt.start_time} onChange={e => handleStartTimeChange(e.target.value)} />
                  </div>
                  <div>
                    <Label>Fim *</Label>
                    <Input type="time" value={newAppt.end_time} onChange={e => setNewAppt(p => ({ ...p, end_time: e.target.value }))} />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Duração padrão: {settings.slot_duration_minutes} min
                </div>
                <div><Label>Observações</Label><Textarea value={newAppt.notes} onChange={e => setNewAppt(p => ({ ...p, notes: e.target.value }))} /></div>
                <Button onClick={handleCreateAppointment} className="w-full">Agendar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <AgendaStats
        appointments={appointments}
        todayAppointments={todayAppointments}
        patientsCount={patients.length}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="agenda" className="gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> Agenda</TabsTrigger>
          <TabsTrigger value="pacientes" className="gap-1.5"><Users className="h-3.5 w-3.5" /> Pacientes</TabsTrigger>
          <TabsTrigger value="whatsapp" className="gap-1.5"><Phone className="h-3.5 w-3.5" /> WhatsApp</TabsTrigger>
        </TabsList>

        {/* AGENDA TAB */}
        <TabsContent value="agenda" className="space-y-4">
          {/* View mode selector */}
          <div className="flex gap-1.5">
            {([
              { key: 'month' as ViewMode, label: '📅 Mês' },
              { key: 'week' as ViewMode, label: '📆 Semana' },
              { key: 'day' as ViewMode, label: '⏰ Dia' },
            ]).map(v => (
              <button
                key={v.key}
                onClick={() => setViewMode(v.key)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors
                  ${viewMode === v.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}
                `}
              >
                {v.label}
              </button>
            ))}
            
            <Button variant="outline" size="sm" className="ml-auto gap-1.5" onClick={() => toast({ title: "Sincronização", description: "Integração com Google Calendar em breve." })}>
              <Settings className="h-3.5 w-3.5" /> Sincronizar Google
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-7 gap-1">
              {Array(35).fill(0).map((_, i) => <Skeleton key={i} className="min-h-[100px] bg-gold/5 rounded-lg" />)}
            </div>
          ) : viewMode === 'month' && (
            <div className="space-y-4">
              <MonthCalendar
                currentMonth={currentMonth}
                onMonthChange={setCurrentMonth}
                selectedDate={selectedDate}
                onDateSelect={(d) => { setSelectedDate(d); }}
                appointments={appointments}
                blocks={blocks}
                onAppointmentClick={handleAppointmentClick}
              />

              {/* Smart Day Panel below calendar */}
              {selectedDate && (() => {
                const dateStr = format(selectedDate, 'yyyy-MM-dd');
                const dayAppts = appointments.filter(a => a.appointment_date === dateStr).sort((a, b) => a.start_time.localeCompare(b.start_time));
                const dayBlocks = blocks.filter(b => b.block_date === dateStr);
                const isFullDayBlocked = dayBlocks.some(b => b.block_type === 'full_day');
                const confirmed = dayAppts.filter(a => a.status === 'confirmado').length;
                const cancelled = dayAppts.filter(a => a.status === 'cancelado').length;
                const pending = dayAppts.filter(a => a.status === 'agendado').length;

                const statusLabel: Record<string, string> = {
                  agendado: 'Pendente',
                  confirmado: 'Confirmado',
                  cancelado: 'Cancelado',
                  realizado: 'Realizado',
                };
                const statusColor: Record<string, string> = {
                  agendado: 'bg-amber-500/15 text-amber-700 border-amber-300',
                  confirmado: 'bg-emerald-500/15 text-emerald-700 border-emerald-300',
                  cancelado: 'bg-red-500/15 text-red-700 border-red-300',
                  realizado: 'bg-blue-500/15 text-blue-700 border-blue-300',
                };
                const statusBorderLeft: Record<string, string> = {
                  agendado: 'border-l-amber-500',
                  confirmado: 'border-l-emerald-500',
                  cancelado: 'border-l-red-500',
                  realizado: 'border-l-blue-500',
                };

                return (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <CardTitle className="text-base capitalize">
                            {format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </CardTitle>
                          {isFullDayBlocked && (
                            <div className="flex items-center gap-1.5 mt-1.5 text-destructive text-xs font-medium">
                              <XCircle className="h-3.5 w-3.5" />
                              Agenda bloqueada neste dia
                            </div>
                          )}
                        </div>
                        {!isFullDayBlocked && (
                          <Button
                            size="sm"
                            className="gap-1.5"
                            onClick={() => {
                              setNewAppt(p => ({ ...p, date: dateStr }));
                              setShowNewAppointment(true);
                            }}
                          >
                            <Plus className="h-3.5 w-3.5" /> Nova Consulta
                          </Button>
                        )}
                      </div>
                      {/* Summary badges */}
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <Badge variant="outline" className="text-xs gap-1">
                          <CalendarDays className="h-3 w-3" /> {dayAppts.length} consulta(s)
                        </Badge>
                        {confirmed > 0 && (
                          <Badge variant="outline" className="text-xs gap-1 bg-emerald-500/10 text-emerald-700 border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" /> {confirmed} confirmada(s)
                          </Badge>
                        )}
                        {pending > 0 && (
                          <Badge variant="outline" className="text-xs gap-1 bg-amber-500/10 text-amber-700 border-amber-200">
                            <Clock className="h-3 w-3" /> {pending} pendente(s)
                          </Badge>
                        )}
                        {cancelled > 0 && (
                          <Badge variant="outline" className="text-xs gap-1 bg-red-500/10 text-red-700 border-red-200">
                            <XCircle className="h-3 w-3" /> {cancelled} cancelada(s)
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {/* Blocks info */}
                      {dayBlocks.map(b => (
                        <div key={b.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 text-xs text-muted-foreground border border-dashed">
                          <Clock className="h-3.5 w-3.5" />
                          <span>
                            {b.block_type === 'full_day' ? 'Dia inteiro bloqueado' : `Bloqueio: ${b.start_time?.slice(0, 5)} - ${b.end_time?.slice(0, 5)}`}
                            {b.reason && ` · ${b.reason}`}
                          </span>
                        </div>
                      ))}

                      {/* Empty state */}
                      {dayAppts.length === 0 && dayBlocks.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">Nenhuma consulta neste dia</p>
                        </div>
                      )}

                      {/* Appointments list with quick actions */}
                      {dayAppts.map(appt => (
                        <div
                          key={appt.id}
                          className={`rounded-lg border border-l-4 p-3 transition-all hover:shadow-sm ${statusBorderLeft[appt.status] || 'border-l-muted'}`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-xs font-medium text-muted-foreground">
                                {appt.start_time?.slice(0, 5)} - {appt.end_time?.slice(0, 5)}
                              </span>
                            </div>
                            <Badge variant="outline" className={`text-[10px] ${statusColor[appt.status]}`}>
                              {statusLabel[appt.status]}
                            </Badge>
                          </div>
                          <p className="text-sm font-semibold mb-2">{appt.patients?.name || 'Paciente'}</p>
                          {appt.notes && <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{appt.notes}</p>}
                          {/* Quick actions */}
                          <div className="flex gap-1.5 flex-wrap">
                            {appt.status !== 'confirmado' && appt.status !== 'cancelado' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs gap-1 bg-emerald-500/10 text-emerald-700 border-emerald-200 hover:bg-emerald-500/20"
                                onClick={() => updateAppointmentStatus(appt.id, 'confirmado')}
                              >
                                <CheckCircle2 className="h-3 w-3" /> Confirmar
                              </Button>
                            )}
                            {appt.status !== 'cancelado' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs gap-1 bg-red-500/10 text-red-700 border-red-200 hover:bg-red-500/20"
                                onClick={() => updateAppointmentStatus(appt.id, 'cancelado')}
                              >
                                <XCircle className="h-3 w-3" /> Cancelar
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1"
                              onClick={() => handleAppointmentClick(appt)}
                            >
                              🔁 Detalhes
                            </Button>
                            {appt.patients?.phone && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs gap-1 bg-emerald-500/5 text-emerald-700 border-emerald-200 hover:bg-emerald-500/15"
                                onClick={() => {
                                  const phone = appt.patients!.phone.replace(/\D/g, '');
                                  window.open(`https://wa.me/${phone}`, '_blank');
                                }}
                              >
                                💬 WhatsApp
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })()}
            </div>
          )}

          {viewMode === 'week' && selectedDate && (
            <WeekView
              date={selectedDate}
              appointments={appointments}
              blocks={blocks}
              workStart={settings.work_start_time}
              workEnd={settings.work_end_time}
              onAppointmentClick={handleAppointmentClick}
              onDayClick={(d) => { setSelectedDate(d); setViewMode('day'); }}
            />
          )}

          {viewMode === 'day' && selectedDate && (
            <DayView
              date={selectedDate}
              appointments={appointments}
              blocks={blocks}
              workStart={settings.work_start_time}
              workEnd={settings.work_end_time}
              onAppointmentClick={handleAppointmentClick}
            />
          )}
        </TabsContent>

        {/* PATIENTS TAB */}
        <TabsContent value="pacientes">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Pacientes ({patients.length})</CardTitle>
                <Button size="sm" className="gap-1.5" onClick={() => setShowNewPatient(true)}>
                  <Plus className="h-3.5 w-3.5" /> Novo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {patients.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Nenhum paciente cadastrado</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {patients.map(p => (
                    <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-semibold text-primary">{p.name.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{p.name}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {p.phone}</span>
                          {p.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {p.email}</span>}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {appointments.filter(a => a.patient_id === p.id).length} consultas
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* WHATSAPP CONFIG TAB */}
        <TabsContent value="whatsapp">
          <WhatsAppConfigTab userId={user?.id} />
        </TabsContent>
      </Tabs>

      {/* Quick View Modal */}
      <AppointmentQuickView
        appointment={quickViewAppt}
        open={showQuickView}
        onOpenChange={setShowQuickView}
        onStatusChange={updateAppointmentStatus}
        userId={user?.id}
      />
    </div>
  );
};

// WhatsApp Config sub-component
const WhatsAppConfigTab = ({ userId }: { userId?: string }) => {
  const [config, setConfig] = useState({ instance_id: '', token: '', client_token: '' });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      const { data } = await supabase
        .from('psychologist_whatsapp_config')
        .select('*')
        .eq('psychologist_id', userId)
        .single();
      if (data) {
        setConfig({ instance_id: data.instance_id, token: data.token, client_token: data.client_token || '' });
        setSaved(true);
        setIsConnected(data.is_connected);
      }
      setLoading(false);
    };
    load();
  }, [userId]);

  const saveConfig = async () => {
    if (!userId || !config.instance_id || !config.token) {
      toast({ title: 'Erro', description: 'ID e Token são obrigatórios.', variant: 'destructive' });
      return;
    }
    const payload = {
      psychologist_id: userId,
      instance_id: config.instance_id,
      token: config.token,
      client_token: config.client_token || null,
    };
    const { error } = saved
      ? await supabase.from('psychologist_whatsapp_config').update(payload).eq('psychologist_id', userId)
      : await supabase.from('psychologist_whatsapp_config').insert(payload);
    if (error) {
      toast({ title: 'Erro', description: 'Erro ao salvar configuração.', variant: 'destructive' });
    } else {
      toast({ title: 'Sucesso', description: 'Configuração salva!' });
      setSaved(true);
    }
  };

  const testConnection = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('zapi-proxy', {
        body: { action: 'status', instanceId: config.instance_id, token: config.token, clientToken: config.client_token }
      });
      if (error) throw error;
      if (data?.connected) {
        setIsConnected(true);
        await supabase.from('psychologist_whatsapp_config').update({ is_connected: true }).eq('psychologist_id', userId);
        toast({ title: 'Conectado!', description: 'WhatsApp conectado com sucesso.' });
      } else {
        toast({ title: 'Não conectado', description: 'Escaneie o QR Code no painel Z-API.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Erro', description: 'Erro ao verificar conexão.', variant: 'destructive' });
    }
  };

  if (loading) return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>;

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-500/10">
            <Phone className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <CardTitle className="text-base">Configuração WhatsApp</CardTitle>
            <CardDescription className="text-xs">Configure sua instância Z-API pessoal</CardDescription>
          </div>
          {isConnected && <Badge className="bg-emerald-500/15 text-emerald-700 ml-auto gap-1"><CheckCircle2 className="h-3 w-3" /> Conectado</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div><Label>ID da Instância *</Label><Input value={config.instance_id} onChange={e => setConfig(c => ({ ...c, instance_id: e.target.value }))} placeholder="3F0796E3B..." /></div>
        <div><Label>Token *</Label><Input value={config.token} onChange={e => setConfig(c => ({ ...c, token: e.target.value }))} placeholder="9544CE53E..." /></div>
        <div><Label>Client Token</Label><Input value={config.client_token} onChange={e => setConfig(c => ({ ...c, client_token: e.target.value }))} placeholder="Opcional" /></div>
        <div className="flex gap-2">
          <Button onClick={saveConfig} className="flex-1 gap-1.5"><Settings className="h-4 w-4" /> Salvar</Button>
          {saved && <Button variant="outline" onClick={testConnection} className="gap-1.5"><Send className="h-4 w-4" /> Testar</Button>}
        </div>
        <div className="bg-muted/50 rounded-lg p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold">Como obter:</p>
          <p>1. Acesse <a href="https://z-api.io" target="_blank" className="text-primary underline">z-api.io</a></p>
          <p>2. Crie uma instância</p>
          <p>3. Copie o ID e Token</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default Agenda;
