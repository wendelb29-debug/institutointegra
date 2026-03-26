import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Ban } from 'lucide-react';
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  eachDayOfInterval, getDay, isToday, isSameDay
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Appointment {
  id: string;
  appointment_date: string;
  start_time: string;
  status: string;
  patients?: { name: string; phone: string };
}

interface ScheduleBlock {
  id: string;
  block_date: string;
  block_type: string;
}

interface MonthCalendarProps {
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  appointments: Appointment[];
  blocks: ScheduleBlock[];
  onAppointmentClick: (appt: Appointment) => void;
}

const statusDot: Record<string, string> = {
  confirmado: 'bg-emerald-500',
  agendado: 'bg-amber-500',
  cancelado: 'bg-red-500',
  realizado: 'bg-blue-500',
};

export const MonthCalendar = ({
  currentMonth, onMonthChange, selectedDate, onDateSelect,
  appointments, blocks, onAppointmentClick
}: MonthCalendarProps) => {
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

  const blockedDates = useMemo(() => {
    const set = new Set<string>();
    blocks.filter(b => b.block_type === 'full_day').forEach(b => set.add(b.block_date));
    return set;
  }, [blocks]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => onMonthChange(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="text-base capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={() => onMonthChange(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
            <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startDayOfWeek }).map((_, i) => <div key={`e-${i}`} />)}
          {daysInMonth.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayAppts = appointmentsByDate[dateStr] || [];
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const today = isToday(day);
            const isBlocked = blockedDates.has(dateStr);

            return (
              <button
                key={dateStr}
                onClick={() => onDateSelect(day)}
                className={`relative rounded-lg text-sm transition-all min-h-[64px] flex flex-col items-start p-1.5 gap-0.5
                  ${isSelected ? 'bg-primary text-primary-foreground ring-2 ring-primary/30' : ''}
                  ${today && !isSelected ? 'bg-accent font-bold' : ''}
                  ${isBlocked && !isSelected ? 'bg-muted/60' : ''}
                  ${!isSelected && !today && !isBlocked ? 'hover:bg-muted/50' : ''}
                `}
              >
                <div className="flex items-center gap-0.5 w-full">
                  <span className="text-xs">{format(day, 'd')}</span>
                  {isBlocked && <Ban className="h-2.5 w-2.5 text-muted-foreground ml-auto" />}
                </div>
                {/* Show up to 2 appointment previews */}
                {dayAppts.slice(0, 2).map(a => (
                  <div
                    key={a.id}
                    onClick={(e) => { e.stopPropagation(); onAppointmentClick(a); }}
                    className={`w-full rounded px-1 py-0.5 text-[9px] leading-tight truncate flex items-center gap-0.5 cursor-pointer
                      ${isSelected ? 'bg-primary-foreground/20 text-primary-foreground' :
                        a.status === 'confirmado' ? 'bg-emerald-500/20 text-emerald-800' :
                        a.status === 'cancelado' ? 'bg-red-500/20 text-red-800' :
                        a.status === 'realizado' ? 'bg-blue-500/20 text-blue-800' :
                        'bg-amber-500/20 text-amber-800'}
                    `}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${isSelected ? 'bg-primary-foreground' : statusDot[a.status] || 'bg-amber-500'}`} />
                    {a.start_time?.slice(0, 5)} {a.patients?.name?.split(' ')[0]}
                  </div>
                ))}
                {dayAppts.length > 2 && (
                  <span className={`text-[9px] ${isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    +{dayAppts.length - 2} mais
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
