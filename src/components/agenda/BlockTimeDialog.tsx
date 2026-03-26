import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Ban } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format, eachDayOfInterval, parseISO, getDate } from 'date-fns';

interface BlockTimeDialogProps {
  userId: string;
  selectedDate?: Date | null;
  onBlockCreated: () => void;
}

const reasons = ['Almoço', 'Reunião', 'Férias', 'Atendimento externo', 'Pessoal', 'Outro'];

type BlockMode = 'single' | 'range';
type DayFilter = 'all' | 'odd' | 'even';

export const BlockTimeDialog = ({ userId, selectedDate, onBlockCreated }: BlockTimeDialogProps) => {
  const [open, setOpen] = useState(false);
  const [fullDay, setFullDay] = useState(false);
  const [blockMode, setBlockMode] = useState<BlockMode>('single');
  const [dayFilter, setDayFilter] = useState<DayFilter>('all');
  const [fixedTime, setFixedTime] = useState(false);
  const [form, setForm] = useState({
    date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
    date_end: '',
    start_time: '12:00',
    end_time: '14:00',
    reason: '',
  });

  const resetForm = () => {
    setForm({ date: '', date_end: '', start_time: '12:00', end_time: '14:00', reason: '' });
    setFullDay(false);
    setBlockMode('single');
    setDayFilter('all');
    setFixedTime(false);
  };

  const getDatesToBlock = (): string[] => {
    if (blockMode === 'single') {
      return form.date ? [form.date] : [];
    }
    if (!form.date || !form.date_end) return [];
    try {
      const days = eachDayOfInterval({ start: parseISO(form.date), end: parseISO(form.date_end) });
      return days
        .filter(d => {
          const dayNum = getDate(d);
          if (dayFilter === 'odd') return dayNum % 2 !== 0;
          if (dayFilter === 'even') return dayNum % 2 === 0;
          return true;
        })
        .map(d => format(d, 'yyyy-MM-dd'));
    } catch {
      return [];
    }
  };

  const handleSave = async () => {
    const dates = getDatesToBlock();
    if (dates.length === 0) {
      toast({ title: 'Erro', description: 'Selecione ao menos uma data.', variant: 'destructive' });
      return;
    }
    const useFullDay = fullDay || (!fixedTime && blockMode !== 'single');
    if (!useFullDay && (!form.start_time || !form.end_time)) {
      toast({ title: 'Erro', description: 'Defina o horário.', variant: 'destructive' });
      return;
    }

    const inserts = dates.map(d => ({
      psychologist_id: userId,
      block_date: d,
      block_type: (useFullDay && !fixedTime) ? 'full_day' : 'partial',
      start_time: (useFullDay && !fixedTime) ? null : form.start_time,
      end_time: (useFullDay && !fixedTime) ? null : form.end_time,
      reason: form.reason || null,
    }));

    const { error } = await supabase.from('schedule_blocks').insert(inserts);

    if (error) {
      toast({ title: 'Erro', description: 'Erro ao bloquear horário.', variant: 'destructive' });
    } else {
      const msg = dates.length === 1
        ? (useFullDay ? 'Dia bloqueado com sucesso.' : 'Horário bloqueado.')
        : `${dates.length} dias bloqueados com sucesso.`;
      toast({ title: 'Bloqueado', description: msg });
      setOpen(false);
      resetForm();
      onBlockCreated();
    }
  };

  const previewDates = getDatesToBlock();

  return (
    <Dialog open={open} onOpenChange={(o) => {
      setOpen(o);
      if (o && selectedDate) setForm(f => ({ ...f, date: format(selectedDate, 'yyyy-MM-dd') }));
      if (!o) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-1.5">
          <Ban className="h-4 w-4" /> Bloquear Horário
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Bloquear Horário</DialogTitle></DialogHeader>
        <div className="space-y-4">
          {/* Block mode */}
          <div>
            <Label className="mb-2 block text-xs text-muted-foreground">Tipo de bloqueio</Label>
            <div className="flex gap-1.5">
              <button
                onClick={() => setBlockMode('single')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${blockMode === 'single' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
              >
                Dia único
              </button>
              <button
                onClick={() => setBlockMode('range')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${blockMode === 'range' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
              >
                Múltiplos dias
              </button>
            </div>
          </div>

          {/* Date selection */}
          {blockMode === 'single' ? (
            <div>
              <Label>Data</Label>
              <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data início</Label>
                <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <Label>Data fim</Label>
                <Input type="date" value={form.date_end} onChange={e => setForm(f => ({ ...f, date_end: e.target.value }))} />
              </div>
            </div>
          )}

          {/* Day filter for range */}
          {blockMode === 'range' && (
            <div>
              <Label className="mb-2 block text-xs text-muted-foreground">Filtrar dias</Label>
              <div className="flex gap-1.5">
                {([
                  { key: 'all' as DayFilter, label: 'Todos' },
                  { key: 'odd' as DayFilter, label: 'Ímpares' },
                  { key: 'even' as DayFilter, label: 'Pares' },
                ]).map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setDayFilter(opt.key)}
                    className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${dayFilter === opt.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Full day toggle */}
          <div className="flex items-center gap-3">
            <Switch checked={fullDay} onCheckedChange={(v) => { setFullDay(v); if (v) setFixedTime(false); }} />
            <Label className="cursor-pointer">Bloquear o dia inteiro</Label>
          </div>

          {/* Fixed time for range */}
          {blockMode === 'range' && !fullDay && (
            <div className="flex items-center gap-3">
              <Switch checked={fixedTime} onCheckedChange={setFixedTime} />
              <Label className="cursor-pointer text-sm">Bloquear horário fixo em todos os dias</Label>
            </div>
          )}

          {/* Time selection */}
          {(blockMode === 'single' && !fullDay) || (blockMode === 'range' && fixedTime) ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Início</Label>
                <Input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} />
              </div>
              <div>
                <Label>Fim</Label>
                <Input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} />
              </div>
            </div>
          ) : null}

          {/* Reason */}
          <div>
            <Label>Motivo</Label>
            <Select value={form.reason} onValueChange={v => setForm(f => ({ ...f, reason: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
              <SelectContent>
                {reasons.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          {blockMode === 'range' && previewDates.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs font-semibold text-muted-foreground mb-1">
                {previewDates.length} dia(s) serão bloqueados:
              </p>
              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                {previewDates.slice(0, 31).map(d => (
                  <span key={d} className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">
                    {d.slice(8)}/{d.slice(5, 7)}
                  </span>
                ))}
                {previewDates.length > 31 && (
                  <span className="text-[10px] text-muted-foreground">+{previewDates.length - 31} mais</span>
                )}
              </div>
            </div>
          )}

          <Button onClick={handleSave} className="w-full">
            {previewDates.length > 1 ? `Bloquear ${previewDates.length} dias` : 'Bloquear'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
