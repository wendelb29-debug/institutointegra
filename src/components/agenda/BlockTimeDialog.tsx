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
import { format } from 'date-fns';

interface BlockTimeDialogProps {
  userId: string;
  selectedDate?: Date | null;
  onBlockCreated: () => void;
}

const reasons = ['Almoço', 'Reunião', 'Férias', 'Atendimento externo', 'Pessoal', 'Outro'];

export const BlockTimeDialog = ({ userId, selectedDate, onBlockCreated }: BlockTimeDialogProps) => {
  const [open, setOpen] = useState(false);
  const [fullDay, setFullDay] = useState(false);
  const [form, setForm] = useState({
    date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
    start_time: '12:00',
    end_time: '14:00',
    reason: '',
  });

  const handleSave = async () => {
    if (!form.date) {
      toast({ title: 'Erro', description: 'Selecione uma data.', variant: 'destructive' });
      return;
    }
    if (!fullDay && (!form.start_time || !form.end_time)) {
      toast({ title: 'Erro', description: 'Defina o horário.', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('schedule_blocks').insert({
      psychologist_id: userId,
      block_date: form.date,
      block_type: fullDay ? 'full_day' : 'partial',
      start_time: fullDay ? null : form.start_time,
      end_time: fullDay ? null : form.end_time,
      reason: form.reason || null,
    });

    if (error) {
      toast({ title: 'Erro', description: 'Erro ao bloquear horário.', variant: 'destructive' });
    } else {
      toast({ title: 'Bloqueado', description: fullDay ? 'Dia bloqueado com sucesso.' : 'Horário bloqueado.' });
      setOpen(false);
      setForm({ date: '', start_time: '12:00', end_time: '14:00', reason: '' });
      setFullDay(false);
      onBlockCreated();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => {
      setOpen(o);
      if (o && selectedDate) setForm(f => ({ ...f, date: format(selectedDate, 'yyyy-MM-dd') }));
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-1.5">
          <Ban className="h-4 w-4" /> Bloquear Horário
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Bloquear Horário</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Data</Label>
            <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={fullDay} onCheckedChange={setFullDay} />
            <Label className="cursor-pointer">Bloquear o dia inteiro</Label>
          </div>
          {!fullDay && (
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
          )}
          <div>
            <Label>Motivo</Label>
            <Select value={form.reason} onValueChange={v => setForm(f => ({ ...f, reason: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
              <SelectContent>
                {reasons.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSave} className="w-full">Bloquear</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
