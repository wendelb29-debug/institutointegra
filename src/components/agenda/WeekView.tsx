import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Ban, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Appointment {
  id: string;
  patient_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
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

interface WeekViewProps {
  date: Date;
  appointments: Appointment[];
  blocks: ScheduleBlock[];
  workStart?: string;
  workEnd?: string;
  onAppointmentClick: (appt: Appointment) => void;
  onDayClick: (date: Date) => void;
}

const statusDot: Record<string, string> = {
  confirmado: 'bg-emerald-500',
  agendado: 'bg-amber-500',
  cancelado: 'bg-red-500',
  realizado: 'bg-blue-500',
};

export const WeekView = ({ date, appointments, blocks, workStart = '08:00', workEnd = '18:00', onAppointmentClick, onDayClick }: WeekViewProps) => {
  const weekStart = startOfWeek(date, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const hours = useMemo(() => {
    const startH = parseInt(workStart.split(':')[0]);
    const endH = parseInt(workEnd.split(':')[0]);
    return Array.from({ length: endH - startH + 1 }, (_, i) => `${String(startH + i).padStart(2, '0')}:00`);
  }, [workStart, workEnd]);

  const getAppts = (day: Date, hour: string) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const hourNum = parseInt(hour.split(':')[0]);
    return appointments.filter(a => a.appointment_date === dateStr && parseInt(a.start_time.split(':')[0]) === hourNum);
  };

  const isDayBlocked = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return blocks.some(b => b.block_date === dateStr && b.block_type === 'full_day');
  };

  const isSlotBlocked = (day: Date, hour: string) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const hourNum = parseInt(hour.split(':')[0]);
    return blocks.some(b => {
      if (b.block_date !== dateStr) return false;
      if (b.block_type === 'full_day') return true;
      if (!b.start_time || !b.end_time) return false;
      return hourNum >= parseInt(b.start_time.split(':')[0]) && hourNum < parseInt(b.end_time.split(':')[0]);
    });
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          Semana de {format(weekStart, "dd 'de' MMMM", { locale: ptBR })}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Header */}
          <div className="grid grid-cols-8 border-b">
            <div className="p-2 text-xs font-medium text-muted-foreground" />
            {weekDays.map(day => (
              <button
                key={day.toISOString()}
                onClick={() => onDayClick(day)}
                className={`p-2 text-center border-l transition-colors hover:bg-muted/50
                  ${isToday(day) ? 'bg-primary/5' : ''}
                  ${isDayBlocked(day) ? 'bg-muted/50' : ''}
                `}
              >
                <p className="text-[10px] uppercase text-muted-foreground">{format(day, 'EEE', { locale: ptBR })}</p>
                <p className={`text-sm font-bold ${isToday(day) ? 'text-primary' : ''}`}>{format(day, 'd')}</p>
              </button>
            ))}
          </div>

          {/* Time grid */}
          {hours.map(hour => (
            <div key={hour} className="grid grid-cols-8 border-b min-h-[40px]">
              <div className="p-1 text-[10px] font-medium text-muted-foreground text-right pr-2 border-r flex items-start justify-end pt-1">
                {hour}
              </div>
              {weekDays.map(day => {
                const appts = getAppts(day, hour);
                const blocked = isSlotBlocked(day, hour);
                return (
                  <div
                    key={`${day.toISOString()}-${hour}`}
                    className={`border-l px-0.5 py-0.5 ${blocked && appts.length === 0 ? 'bg-muted/40' : ''}`}
                  >
                    {blocked && appts.length === 0 && (
                      <div className="flex items-center justify-center h-full">
                        <Ban className="h-3 w-3 text-muted-foreground/40" />
                      </div>
                    )}
                    {appts.map(appt => (
                      <button
                        key={appt.id}
                        onClick={() => onAppointmentClick(appt)}
                        className={`w-full text-left rounded px-1 py-0.5 text-[10px] leading-tight truncate flex items-center gap-0.5 hover:opacity-80
                          ${appt.status === 'confirmado' ? 'bg-emerald-500/20 text-emerald-800' :
                            appt.status === 'cancelado' ? 'bg-red-500/20 text-red-800 line-through' :
                            appt.status === 'realizado' ? 'bg-blue-500/20 text-blue-800' :
                            'bg-amber-500/20 text-amber-800'}
                        `}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${statusDot[appt.status] || 'bg-amber-500'}`} />
                        {appt.patients?.name?.split(' ')[0] || '?'}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
