import { Card, CardContent } from '@/components/ui/card';
import { CalendarDays, CheckCircle2, AlertCircle, Users, TrendingUp, XCircle } from 'lucide-react';

interface Appointment {
  id: string;
  status: string;
  appointment_date: string;
  patient_id: string;
}

interface AgendaStatsProps {
  appointments: Appointment[];
  todayAppointments: Appointment[];
  patientsCount: number;
}

export const AgendaStats = ({ appointments, todayAppointments, patientsCount }: AgendaStatsProps) => {
  const confirmed = appointments.filter(a => a.status === 'confirmado').length;
  const pending = appointments.filter(a => a.status === 'agendado').length;
  const cancelled = appointments.filter(a => a.status === 'cancelado').length;
  const total = appointments.length;
  const confirmationRate = total > 0 ? Math.round(((confirmed + appointments.filter(a => a.status === 'realizado').length) / total) * 100) : 0;
  const todayNoShows = todayAppointments.filter(a => a.status === 'cancelado').length;

  const stats = [
    { label: 'Hoje', value: todayAppointments.length, icon: CalendarDays, color: 'bg-primary/10 text-primary' },
    { label: 'Confirmadas', value: confirmed, icon: CheckCircle2, color: 'bg-emerald-500/10 text-emerald-600' },
    { label: 'Pendentes', value: pending, icon: AlertCircle, color: 'bg-amber-500/10 text-amber-600' },
    { label: 'Canceladas', value: cancelled, icon: XCircle, color: 'bg-red-500/10 text-red-600' },
    { label: 'Taxa Confirmação', value: `${confirmationRate}%`, icon: TrendingUp, color: 'bg-blue-500/10 text-blue-600' },
    { label: 'Pacientes', value: patientsCount, icon: Users, color: 'bg-violet-500/10 text-violet-600' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map(s => (
        <Card key={s.label}>
          <CardContent className="p-3 flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${s.color}`}>
              <s.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground leading-tight">{s.label}</p>
              <p className="text-lg font-bold leading-tight">{s.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
