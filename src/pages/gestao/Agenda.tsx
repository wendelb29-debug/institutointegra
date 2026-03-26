import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  CalendarDays, Plus, Users, Clock, Phone, Mail, FileText,
  CheckCircle2, XCircle, AlertCircle, Send, Settings, ChevronLeft, ChevronRight
} from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, getDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

const statusConfig = {
  agendado: { label: 'Agendado', color: 'bg-amber-500/15 text-amber-700 border-amber-200', icon: Clock },
  confirmado: { label: 'Confirmado', color: 'bg-emerald-500/15 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  cancelado: { label: 'Cancelado', color: 'bg-red-500/15 text-red-700 border-red-200', icon: XCircle },
  realizado: { label: 'Realizado', color: 'bg-blue-500/15 text-blue-700 border-blue-200', icon: CheckCircle2 },
};

const Agenda = () => {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [activeTab, setActiveTab] = useState('agenda');

  // New appointment form
  const [newAppt, setNewAppt] = useState({ patient_id: '', date: '', start_time: '', end_time: '', notes: '' });
  // New patient form
  const [newPatient, setNewPatient] = useState({ name: '', phone: '', email: '', cpf: '', notes: '' });

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [patientsRes, appointmentsRes] = await Promise.all([
        supabase.from('patients').select('*').eq('psychologist_id', user.id).order('name'),
        supabase.from('appointments').select('*, patients(name, phone)').eq('psychologist_id', user.id).order('appointment_date'),
      ]);
      if (patientsRes.data) setPatients(patientsRes.data);
      if (appointmentsRes.data) setAppointments(appointmentsRes.data as unknown as Appointment[]);
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
      // Send WhatsApp notification
      const patient = patients.find(p => p.id === newAppt.patient_id);
      if (patient) {
        sendWhatsAppNotification(patient, newAppt.date, newAppt.start_time);
      }
      setNewAppt({ patient_id: '', date: '', start_time: '', end_time: '', notes: '' });
      setShowNewAppointment(false);
      fetchData();
    }
  };

  const sendWhatsAppNotification = async (patient: Patient, date: string, time: string) => {
    try {
      // Get psychologist's WhatsApp config
      const { data: config } = await supabase
        .from('psychologist_whatsapp_config')
        .select('*')
        .eq('psychologist_id', user!.id)
        .single();

      if (!config) return;

      const formattedDate = format(new Date(date + 'T12:00:00'), "dd/MM/yyyy", { locale: ptBR });
      const message = `Olá ${patient.name}, sua consulta foi agendada para ${formattedDate} às ${time}. Instituto Integra.`;

      await supabase.functions.invoke('zapi-proxy', {
        body: {
          action: 'send',
          phone: patient.phone,
          message,
          instanceId: config.instance_id,
          token: config.token,
          clientToken: config.client_token,
        }
      });
    } catch {
      // Silently fail - notification is not critical
    }
  };

  const updateAppointmentStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('appointments').update({ status } as any).eq('id', id);
    if (error) {
      toast({ title: 'Erro', description: 'Erro ao atualizar status.', variant: 'destructive' });
    } else {
      fetchData();
    }
  };

  // Calendar logic
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);

  const appointmentsByDate = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    appointments.forEach(a => {
      if (!map[a.appointment_date]) map[a.appointment_date] = [];
      map[a.appointment_date].push(a);
    });
    return map;
  }, [appointments]);

  const selectedDateAppointments = selectedDate
    ? appointmentsByDate[format(selectedDate, 'yyyy-MM-dd')] || []
    : [];

  const todayAppointments = appointmentsByDate[format(new Date(), 'yyyy-MM-dd')] || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display text-foreground">Agenda</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie consultas e pacientes</p>
        </div>
        <div className="flex gap-2">
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
                <div><Label>Data *</Label><Input type="date" value={newAppt.date} onChange={e => setNewAppt(p => ({ ...p, date: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Início *</Label><Input type="time" value={newAppt.start_time} onChange={e => setNewAppt(p => ({ ...p, start_time: e.target.value }))} /></div>
                  <div><Label>Fim *</Label><Input type="time" value={newAppt.end_time} onChange={e => setNewAppt(p => ({ ...p, end_time: e.target.value }))} /></div>
                </div>
                <div><Label>Observações</Label><Textarea value={newAppt.notes} onChange={e => setNewAppt(p => ({ ...p, notes: e.target.value }))} /></div>
                <Button onClick={handleCreateAppointment} className="w-full">Agendar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10"><CalendarDays className="h-5 w-5 text-primary" /></div>
          <div><p className="text-xs text-muted-foreground">Hoje</p><p className="text-lg font-bold">{todayAppointments.length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10"><CheckCircle2 className="h-5 w-5 text-emerald-600" /></div>
          <div><p className="text-xs text-muted-foreground">Confirmadas</p><p className="text-lg font-bold">{appointments.filter(a => a.status === 'confirmado').length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10"><AlertCircle className="h-5 w-5 text-amber-600" /></div>
          <div><p className="text-xs text-muted-foreground">Pendentes</p><p className="text-lg font-bold">{appointments.filter(a => a.status === 'agendado').length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10"><Users className="h-5 w-5 text-blue-600" /></div>
          <div><p className="text-xs text-muted-foreground">Pacientes</p><p className="text-lg font-bold">{patients.length}</p></div>
        </CardContent></Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="agenda" className="gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> Agenda</TabsTrigger>
          <TabsTrigger value="pacientes" className="gap-1.5"><Users className="h-3.5 w-3.5" /> Pacientes</TabsTrigger>
          <TabsTrigger value="whatsapp" className="gap-1.5"><Phone className="h-3.5 w-3.5" /> WhatsApp</TabsTrigger>
        </TabsList>

        {/* AGENDA TAB */}
        <TabsContent value="agenda">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Calendar */}
            <Card className="lg:col-span-2">
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
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                    <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: startDayOfWeek }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {daysInMonth.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const dayAppts = appointmentsByDate[dateStr] || [];
                    const hasAppts = dayAppts.length > 0;
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const today = isToday(day);

                    return (
                      <button
                        key={dateStr}
                        onClick={() => setSelectedDate(day)}
                        className={`relative p-2 rounded-lg text-sm transition-all min-h-[48px] flex flex-col items-center gap-0.5
                          ${isSelected ? 'bg-primary text-primary-foreground ring-2 ring-primary/30' : ''}
                          ${today && !isSelected ? 'bg-accent font-bold' : ''}
                          ${!isSelected && !today ? 'hover:bg-muted/50' : ''}
                        `}
                      >
                        <span>{format(day, 'd')}</span>
                        {hasAppts && (
                          <div className="flex gap-0.5">
                            {dayAppts.slice(0, 3).map((a, i) => (
                              <div
                                key={i}
                                className={`h-1.5 w-1.5 rounded-full ${
                                  a.status === 'confirmado' ? 'bg-emerald-500' :
                                  a.status === 'cancelado' ? 'bg-red-500' :
                                  a.status === 'realizado' ? 'bg-blue-500' :
                                  'bg-amber-500'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Day Detail */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {selectedDate ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR }) : 'Selecione um dia'}
                </CardTitle>
                <CardDescription className="text-xs">
                  {selectedDateAppointments.length} consulta(s)
                </CardDescription>
              </CardHeader>
              <ScrollArea className="h-[400px]">
                <CardContent className="space-y-2">
                  {selectedDateAppointments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-xs">Nenhuma consulta neste dia</p>
                    </div>
                  ) : (
                    selectedDateAppointments.map(appt => {
                      const cfg = statusConfig[appt.status];
                      const Icon = cfg.icon;
                      return (
                        <div key={appt.id} className="p-3 rounded-lg border bg-card space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{appt.patients?.name}</p>
                            <Badge className={`${cfg.color} gap-1 text-[10px]`}>
                              <Icon className="h-2.5 w-2.5" /> {cfg.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {appt.start_time.slice(0, 5)} - {appt.end_time.slice(0, 5)}
                          </div>
                          {appt.notes && <p className="text-xs text-muted-foreground">{appt.notes}</p>}
                          <div className="flex gap-1.5">
                            {appt.status === 'agendado' && (
                              <>
                                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => updateAppointmentStatus(appt.id, 'confirmado')}>
                                  <CheckCircle2 className="h-3 w-3" /> Confirmar
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-destructive" onClick={() => updateAppointmentStatus(appt.id, 'cancelado')}>
                                  <XCircle className="h-3 w-3" /> Cancelar
                                </Button>
                              </>
                            )}
                            {appt.status === 'confirmado' && (
                              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => updateAppointmentStatus(appt.id, 'realizado')}>
                                <CheckCircle2 className="h-3 w-3" /> Realizado
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </ScrollArea>
            </Card>
          </div>
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
        body: {
          action: 'status',
          instanceId: config.instance_id,
          token: config.token,
          clientToken: config.client_token,
        }
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
