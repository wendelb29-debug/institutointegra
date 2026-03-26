import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, TrendingUp, Calendar } from 'lucide-react';
import { AIAssistantButton } from './AIAssistantButton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function PatientEvolutions({ patientId }: { patientId: string }) {
  const [evolutions, setEvolutions] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ session_date: new Date().toISOString().split('T')[0], description: '', comparison_notes: '' });
  const { user } = useAuth();
  const { toast } = useToast();

  const fetch_ = async () => {
    const { data } = await supabase.from('patient_evolutions').select('*').eq('patient_id', patientId).order('session_date', { ascending: false });
    setEvolutions(data || []);
  };
  useEffect(() => { fetch_(); }, [patientId]);

  const handleSave = async () => {
    if (!form.description || !user) return;
    const { error } = await supabase.from('patient_evolutions').insert({
      patient_id: patientId, psychologist_id: user.id,
      session_date: form.session_date, description: form.description, comparison_notes: form.comparison_notes || null,
    });
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Evolução registrada!' });
    setOpen(false); setForm({ session_date: new Date().toISOString().split('T')[0], description: '', comparison_notes: '' }); fetch_();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Evolução do Paciente</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" className="gap-1"><Plus className="h-3.5 w-3.5" />Nova Evolução</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Registrar Evolução</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Data</Label><Input type="date" value={form.session_date} onChange={e => setForm({ ...form, session_date: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>Descrição da Evolução</Label>
                <Textarea rows={5} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Descreva a evolução observada..." />
                <AIAssistantButton text={form.description} onApply={(r) => setForm({ ...form, description: r })} context="prontuario" compact />
              </div>
              <div className="space-y-2"><Label>Notas de Comparação (opcional)</Label><Textarea rows={3} value={form.comparison_notes} onChange={e => setForm({ ...form, comparison_notes: e.target.value })} placeholder="Compare com sessões anteriores..." /></div>
              <Button onClick={handleSave} className="w-full" disabled={!form.description}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {evolutions.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">Nenhuma evolução registrada.</p>
        ) : (
          <div className="relative border-l-2 border-primary/20 ml-3 space-y-6 pl-6">
            {evolutions.map(ev => (
              <div key={ev.id} className="relative">
                <div className="absolute -left-[31px] top-1 h-4 w-4 rounded-full bg-primary border-2 border-background" />
                <div className="text-xs text-muted-foreground mb-1">{format(new Date(ev.session_date), "dd/MM/yyyy", { locale: ptBR })}</div>
                <p className="text-sm whitespace-pre-wrap">{ev.description}</p>
                {ev.comparison_notes && <p className="text-xs text-muted-foreground mt-1 italic">📊 {ev.comparison_notes}</p>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
