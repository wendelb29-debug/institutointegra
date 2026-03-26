import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Ban, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Appointment {
  id: string;
  patient_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes?: string;
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

interface DayViewProps {
  date: Date;
  appointments: Appointment[];
  blocks: ScheduleBlock[];
  workStart?: string;
  workEnd?: string;
  onAppointmentClick: (appt: Appointment) => void;
}

const statusColors: Record<string, string> = {
  confirmado: 'border-l-emerald-500 bg-emerald-500/10',
  agendado: 'border-l-amber-500 bg-amber-500/10',
  cancelado: 'border-l-red-500 bg-red-500/10 opacity-60',
  realizado: 'border-l-blue-500 bg-blue-500/10',
};

const statusIcons: Record<string, any> = {
  confirmado: CheckCircle2,
  agendado: Clock,
  cancelado: XCircle,
  realizado: CheckCircle2,
};

export const DayView = ({ date, appointments, blocks, workStart = '08:00', workEnd = '18:00', onAppointmentClick }: DayViewProps) => {
  const dateStr = format(date, 'yyyy-MM-dd');

  const hours = useMemo(() => {
    const startH = parseInt(workStart.split(':')[0]);
    const endH = parseInt(workEnd.split(':')[0]);
    const result: string[] = [];
    for (let h = startH; h <= endH; h++) {
      result.push(`${String(h).padStart(2, '0')}:00`);
    }
    return result;
  }, [workStart, workEnd]);

  const dayAppts = appointments.filter(a => a.appointment_date === dateStr);
  const dayBlocks = blocks.filter(b => b.block_date === dateStr);
  const isFullDayBlocked = dayBlocks.some(b => b.block_type === 'full_day');

  const getApptForHour = (hour: string) => {
    const hourNum = parseInt(hour.split(':')[0]);
    return dayAppts.filter(a => {
      const apptHour = parseInt(a.start_time.split(':')[0]);
      return apptHour === hourNum;
    });
  };

  const isHourBlocked = (hour: string) => {
    if (isFullDayBlocked) return true;
    const hourNum = parseInt(hour.split(':')[0]);
    return dayBlocks.some(b => {
      if (b.block_type === 'full_day') return true;
      if (!b.start_time || !b.end_time) return false;
      const bStart = parseInt(b.start_time.split(':')[0]);
      const bEnd = parseInt(b.end_time.split(':')[0]);
      return hourNum >= bStart && hourNum < bEnd;
    });
  };

  const getBlockReason = (hour: string) => {
    if (isFullDayBlocked) {
      const block = dayBlocks.find(b => b.block_type === 'full_day');
      return block?.reason || 'Bloqueado';
    }
    const hourNum = parseInt(hour.split(':')[0]);
    const block = dayBlocks.find(b => {
      if (!b.start_time || !b.end_time) return false;
      const bStart = parseInt(b.start_time.split(':')[0]);
      const bEnd = parseInt(b.end_time.split(':')[0]);
      return hourNum >= bStart && hourNum < bEnd;
    });
    return block?.reason || 'Bloqueado';
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base capitalize flex items-center gap-2">
          {format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          {isFullDayBlocked && (
            <Badge variant="outline" className="bg-muted text-muted-foreground gap-1 text-xs">
              <Ban className="h-3 w-3" /> Dia Bloqueado
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {hours.map(hour => {
            const appts = getApptForHour(hour);
            const blocked = isHourBlocked(hour);

            return (
              <div
                key={hour}
                className={`flex min-h-[56px] ${blocked && appts.length === 0 ? 'bg-muted/50' : ''}`}
              >
                {/* Time label */}
                <div className="w-16 shrink-0 flex items-start justify-end pr-3 pt-2 text-xs font-medium text-muted-foreground border-r">
                  {hour}
                </div>

                {/* Content */}
                <div className="flex-1 px-3 py-1.5 space-y-1">
                  {blocked && appts.length === 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
                      <Ban className="h-3.5 w-3.5" />
                      <span className="italic">{getBlockReason(hour)}</span>
                    </div>
                  )}
                  {appts.map(appt => {
                    const StatusIcon = statusIcons[appt.status] || Clock;
                    return (
                      <button
                        key={appt.id}
                        onClick={() => onAppointmentClick(appt)}
                        className={`w-full text-left rounded-lg border-l-4 px-3 py-2 transition-all hover:shadow-md cursor-pointer ${statusColors[appt.status] || statusColors.agendado}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <StatusIcon className="h-3.5 w-3.5" />
                            <span className="text-sm font-medium">{appt.patients?.name || 'Paciente'}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{appt.start_time} - {appt.end_time}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
