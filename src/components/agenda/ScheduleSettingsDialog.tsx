import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ScheduleSettingsDialogProps {
  userId: string;
  onSettingsChange: () => void;
}

const weekDays = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
];

export const ScheduleSettingsDialog = ({ userId, onSettingsChange }: ScheduleSettingsDialogProps) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    work_start_time: '08:00',
    work_end_time: '18:00',
    slot_duration_minutes: 50,
    break_duration_minutes: 10,
    working_days: [1, 2, 3, 4, 5],
  });
  const [existingId, setExistingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !userId) return;
    const load = async () => {
      const { data } = await supabase
        .from('schedule_settings')
        .select('*')
        .eq('psychologist_id', userId)
        .single();
      if (data) {
        setExistingId(data.id);
        setForm({
          work_start_time: data.work_start_time?.slice(0, 5) || '08:00',
          work_end_time: data.work_end_time?.slice(0, 5) || '18:00',
          slot_duration_minutes: data.slot_duration_minutes || 50,
          break_duration_minutes: data.break_duration_minutes || 10,
          working_days: data.working_days || [1, 2, 3, 4, 5],
        });
      }
    };
    load();
  }, [open, userId]);

  const handleSave = async () => {
    const payload = {
      psychologist_id: userId,
      work_start_time: form.work_start_time,
      work_end_time: form.work_end_time,
      slot_duration_minutes: form.slot_duration_minutes,
      break_duration_minutes: form.break_duration_minutes,
      working_days: form.working_days,
    };

    const { error } = existingId
      ? await supabase.from('schedule_settings').update(payload).eq('id', existingId)
      : await supabase.from('schedule_settings').insert(payload);

    if (error) {
      toast({ title: 'Erro', description: 'Erro ao salvar configurações.', variant: 'destructive' });
    } else {
      toast({ title: 'Salvo', description: 'Configurações atualizadas.' });
      setOpen(false);
      onSettingsChange();
    }
  };

  const toggleDay = (day: number) => {
    setForm(f => ({
      ...f,
      working_days: f.working_days.includes(day)
        ? f.working_days.filter(d => d !== day)
        : [...f.working_days, day].sort(),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Configurações da Agenda</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Horário de início</Label>
              <Input type="time" value={form.work_start_time} onChange={e => setForm(f => ({ ...f, work_start_time: e.target.value }))} />
            </div>
            <div>
              <Label>Horário de término</Label>
              <Input type="time" value={form.work_end_time} onChange={e => setForm(f => ({ ...f, work_end_time: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Duração da consulta (min)</Label>
              <Input type="number" value={form.slot_duration_minutes} onChange={e => setForm(f => ({ ...f, slot_duration_minutes: parseInt(e.target.value) || 50 }))} />
            </div>
            <div>
              <Label>Intervalo entre consultas (min)</Label>
              <Input type="number" value={form.break_duration_minutes} onChange={e => setForm(f => ({ ...f, break_duration_minutes: parseInt(e.target.value) || 10 }))} />
            </div>
          </div>
          <div>
            <Label className="mb-2 block">Dias de trabalho</Label>
            <div className="flex gap-2 flex-wrap">
              {weekDays.map(d => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => toggleDay(d.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                    ${form.working_days.includes(d.value) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}
                  `}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          <Button onClick={handleSave} className="w-full">Salvar Configurações</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
