import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface Props { patientId: string; onUpdate?: () => void; }

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  compareceu: { label: 'Compareceu', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  faltou: { label: 'Faltou', color: 'bg-red-100 text-red-800', icon: XCircle },
  cancelou: { label: 'Cancelou', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
};

export function PatientAttendance({ patientId, onUpdate }: Props) {
  const [records, setRecords] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ attendance_date: new Date().toISOString().split('T')[0], status: 'compareceu', notes: '' });
  const { user } = useAuth();
  const { toast } = useToast();

  const fetch_ = async () => {
    const { data } = await supabase.from('patient_attendance').select('*').eq('patient_id', patientId).order('attendance_date', { ascending: false });
    setRecords(data || []);
  };
  useEffect(() => { fetch_(); }, [patientId]);

  const stats = {
    total: records.length,
    presente: records.filter(r => r.status === 'compareceu').length,
    faltou: records.filter(r => r.status === 'faltou').length,
    cancelou: records.filter(r => r.status === 'cancelou').length,
  };

  const handleSave = async () => {
    if (!user) return;
    const { error } = await supabase.from('patient_attendance').insert({
      patient_id: patientId, psychologist_id: user.id,
      attendance_date: form.attendance_date, status: form.status, notes: form.notes || null,
    });
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Registro salvo!' });
    setOpen(false); setForm({ attendance_date: new Date().toISOString().split('T')[0], status: 'compareceu', notes: '' });
    fetch_(); onUpdate?.();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Controle de Presença</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" className="gap-1"><Plus className="h-3.5 w-3.5" />Registrar</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Registrar Presença</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Data</Label><Input type="date" value={form.attendance_date} onChange={e => setForm({ ...form, attendance_date: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compareceu">✅ Compareceu</SelectItem>
                    <SelectItem value="faltou">❌ Faltou</SelectItem>
                    <SelectItem value="cancelou">⚠️ Cancelou</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Observações (opcional)</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
              <Button onClick={handleSave} className="w-full">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center p-3 bg-muted/50 rounded-lg"><div className="text-2xl font-bold">{stats.total}</div><div className="text-xs text-muted-foreground">Total</div></div>
          <div className="text-center p-3 bg-green-50 rounded-lg"><div className="text-2xl font-bold text-green-700">{stats.presente}</div><div className="text-xs text-green-600">Presente</div></div>
          <div className="text-center p-3 bg-red-50 rounded-lg"><div className="text-2xl font-bold text-red-700">{stats.faltou}</div><div className="text-xs text-red-600">Faltas</div></div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg"><div className="text-2xl font-bold text-yellow-700">{stats.cancelou}</div><div className="text-xs text-yellow-600">Cancelou</div></div>
        </div>
        <div className="space-y-2">
          {records.map(r => {
            const cfg = statusConfig[r.status];
            const Icon = cfg.icon;
            return (
              <div key={r.id} className="flex items-center justify-between border border-border/60 rounded-lg px-4 py-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">{format(new Date(r.attendance_date), 'dd/MM/yyyy')}</span>
                  <Badge className={`${cfg.color} gap-1`}><Icon className="h-3 w-3" />{cfg.label}</Badge>
                </div>
                {r.notes && <span className="text-xs text-muted-foreground max-w-[200px] truncate">{r.notes}</span>}
              </div>
            );
          })}
          {records.length === 0 && <p className="text-center py-6 text-muted-foreground">Nenhum registro de presença.</p>}
        </div>
      </CardContent>
    </Card>
  );
}
