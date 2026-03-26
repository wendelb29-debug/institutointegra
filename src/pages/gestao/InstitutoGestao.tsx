import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  Plus, CalendarDays, Users, GraduationCap, Search,
  FileText, TrendingUp, Stethoscope, AlertTriangle, Package, ClipboardList, BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PatientProfile } from '@/components/instituto/clinical/PatientProfile';
import type { Database } from '@/integrations/supabase/types';

type Event = Database['public']['Tables']['instituto_events']['Row'];

const InstitutoGestao = () => {
  const [tab, setTab] = useState('eventos');
  const [events, setEvents] = useState<Event[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({});
  const [searchPatient, setSearchPatient] = useState('');
  const [stats, setStats] = useState({ totalRecords: 0, totalAttendance: 0, totalPackages: 0 });
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchData = async () => {
    const [eRes, rRes, pRes] = await Promise.all([
      supabase.from('instituto_events').select('*').order('event_date', { ascending: false }),
      supabase.from('rooms').select('id, name').order('name'),
      supabase.from('patients').select('*').order('name'),
    ]);
    setEvents(eRes.data || []);
    setRooms(rRes.data || []);
    setPatients(pRes.data || []);

    // Stats
    const [rec, att, pkg] = await Promise.all([
      supabase.from('clinical_records').select('*', { count: 'exact', head: true }),
      supabase.from('patient_attendance').select('*', { count: 'exact', head: true }),
      supabase.from('patient_packages').select('*', { count: 'exact', head: true }).eq('is_active', true),
    ]);
    setStats({ totalRecords: rec.count || 0, totalAttendance: att.count || 0, totalPackages: pkg.count || 0 });
  };

  useEffect(() => { fetchData(); }, []);

  const handleSaveEvent = async () => {
    if (!form.title || !form.event_date) return;
    const { error } = await supabase.from('instituto_events').insert({
      title: form.title, description: form.description, event_date: form.event_date,
      start_time: form.start_time, end_time: form.end_time, room_id: form.room_id || null,
      max_participants: form.max_participants || 20, instructor: form.instructor, category: form.category,
    });
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Evento criado!' });
    setOpen(false); setForm({}); fetchData();
  };

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchPatient.toLowerCase()) ||
    p.phone.includes(searchPatient)
  );

  if (selectedPatient) {
    return <PatientProfile patient={selectedPatient} onBack={() => { setSelectedPatient(null); fetchData(); }} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display text-foreground">Instituto Integra</h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Users className="h-5 w-5 text-primary" /></div>
              <div><div className="text-2xl font-bold">{patients.length}</div><div className="text-xs text-muted-foreground">Pacientes</div></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center"><FileText className="h-5 w-5 text-blue-600" /></div>
              <div><div className="text-2xl font-bold">{stats.totalRecords}</div><div className="text-xs text-muted-foreground">Prontuários</div></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center"><CalendarDays className="h-5 w-5 text-green-600" /></div>
              <div><div className="text-2xl font-bold">{stats.totalAttendance}</div><div className="text-xs text-muted-foreground">Atendimentos</div></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center"><Package className="h-5 w-5 text-amber-600" /></div>
              <div><div className="text-2xl font-bold">{stats.totalPackages}</div><div className="text-xs text-muted-foreground">Pacotes Ativos</div></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="eventos" className="gap-1"><GraduationCap className="h-3.5 w-3.5" />Eventos</TabsTrigger>
          <TabsTrigger value="pacientes" className="gap-1"><Users className="h-3.5 w-3.5" />Pacientes</TabsTrigger>
          <TabsTrigger value="prontuario" className="gap-1"><FileText className="h-3.5 w-3.5" />Prontuário</TabsTrigger>
          <TabsTrigger value="evolucao" className="gap-1"><TrendingUp className="h-3.5 w-3.5" />Evolução</TabsTrigger>
          <TabsTrigger value="diagnostico" className="gap-1"><Stethoscope className="h-3.5 w-3.5" />Diagnóstico</TabsTrigger>
          <TabsTrigger value="faltas" className="gap-1"><AlertTriangle className="h-3.5 w-3.5" />Faltas</TabsTrigger>
          <TabsTrigger value="pacotes" className="gap-1"><Package className="h-3.5 w-3.5" />Pacotes</TabsTrigger>
          <TabsTrigger value="anamnese" className="gap-1"><ClipboardList className="h-3.5 w-3.5" />Anamnese</TabsTrigger>
          <TabsTrigger value="relatorios" className="gap-1"><BarChart3 className="h-3.5 w-3.5" />Relatórios</TabsTrigger>
        </TabsList>

        {/* Eventos Tab */}
        <TabsContent value="eventos">
          <div className="flex justify-end mb-4">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" />Novo Evento</Button></DialogTrigger>
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
                  <Button onClick={handleSaveEvent} className="w-full">Criar Evento</Button>
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
                  <div className="flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5" /><span>{new Date(ev.event_date).toLocaleDateString('pt-BR')}</span>{ev.start_time && <span>{ev.start_time.slice(0,5)} - {ev.end_time?.slice(0,5)}</span>}</div>
                  <div className="flex items-center gap-2"><Users className="h-3.5 w-3.5" /><span>{ev.current_participants}/{ev.max_participants} participantes</span></div>
                  {ev.instructor && <p>Instrutor: {ev.instructor}</p>}
                </CardContent>
              </Card>
            ))}
            {events.length === 0 && <div className="col-span-full text-center py-12 text-muted-foreground">Nenhum evento cadastrado.</div>}
          </div>
        </TabsContent>

        {/* Pacientes Tab - select a patient to open profile */}
        <TabsContent value="pacientes">
          <div className="space-y-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar paciente..." value={searchPatient} onChange={e => setSearchPatient(e.target.value)} className="pl-10" />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map(p => (
                  <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedPatient(p)}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.phone}</TableCell>
                    <TableCell>{p.email || '—'}</TableCell>
                    <TableCell><Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); setSelectedPatient(p); }}>Abrir Perfil</Button></TableCell>
                  </TableRow>
                ))}
                {filteredPatients.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhum paciente encontrado.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Quick access tabs - redirect to patient selection */}
        {['prontuario', 'evolucao', 'diagnostico', 'faltas', 'pacotes', 'anamnese'].map(tabKey => (
          <TabsContent key={tabKey} value={tabKey}>
            <Card>
              <CardContent className="py-12 text-center space-y-4">
                <p className="text-muted-foreground">Selecione um paciente para acessar {
                  { prontuario: 'o prontuário', evolucao: 'a evolução', diagnostico: 'os diagnósticos', faltas: 'o controle de faltas', pacotes: 'os pacotes', anamnese: 'a anamnese' }[tabKey]
                }.</p>
                <div className="relative max-w-md mx-auto">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar paciente..." value={searchPatient} onChange={e => setSearchPatient(e.target.value)} className="pl-10" />
                </div>
                {searchPatient && (
                  <div className="max-w-md mx-auto space-y-1">
                    {filteredPatients.slice(0, 5).map(p => (
                      <div key={p.id} className="flex items-center justify-between border border-border/60 rounded-lg px-4 py-2 cursor-pointer hover:bg-muted/50" onClick={() => setSelectedPatient(p)}>
                        <span className="text-sm font-medium">{p.name}</span>
                        <span className="text-xs text-muted-foreground">{p.phone}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}

        {/* Relatórios Tab */}
        <TabsContent value="relatorios">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Resumo Geral</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Total de Pacientes</span><span className="font-bold">{patients.length}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Registros de Prontuário</span><span className="font-bold">{stats.totalRecords}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Registros de Presença</span><span className="font-bold">{stats.totalAttendance}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Pacotes Ativos</span><span className="font-bold">{stats.totalPackages}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Eventos Cadastrados</span><span className="font-bold">{events.length}</span></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Pacientes por Profissional</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-6">Selecione um paciente nas outras abas para ver detalhes individuais.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InstitutoGestao;
