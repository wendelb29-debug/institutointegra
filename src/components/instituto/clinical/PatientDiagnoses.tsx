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
import { Plus, FileDown, Calendar, Pencil } from 'lucide-react';
import { AIAssistantButton } from './AIAssistantButton';
import { TemplatesPanel } from './TemplatesPanel';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  patientId: string;
  patientName: string;
}

export function PatientDiagnoses({ patientId, patientName }: Props) {
  const [diagnoses, setDiagnoses] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ diagnosis_date: new Date().toISOString().split('T')[0], description: '', cid_code: '' });
  const { user } = useAuth();
  const { toast } = useToast();

  const fetch_ = async () => {
    const { data } = await supabase.from('patient_diagnoses').select('*').eq('patient_id', patientId).order('diagnosis_date', { ascending: false });
    setDiagnoses(data || []);
  };
  useEffect(() => { fetch_(); }, [patientId]);

  const handleSave = async () => {
    if (!form.description || !user) return;
    if (editing) {
      const { error } = await supabase.from('patient_diagnoses').update({
        description: form.description, cid_code: form.cid_code || null, diagnosis_date: form.diagnosis_date,
      }).eq('id', editing.id);
      if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Diagnóstico atualizado!' });
    } else {
      const { error } = await supabase.from('patient_diagnoses').insert({
        patient_id: patientId, psychologist_id: user.id,
        diagnosis_date: form.diagnosis_date, description: form.description, cid_code: form.cid_code || null,
      });
      if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Diagnóstico registrado!' });
    }
    setOpen(false); setEditing(null);
    setForm({ diagnosis_date: new Date().toISOString().split('T')[0], description: '', cid_code: '' });
    fetch_();
  };

  const generatePDF = (diag: any) => {
    const content = `
DIAGNÓSTICO CLÍNICO
═══════════════════════════════════════

Paciente: ${patientName}
Data: ${format(new Date(diag.diagnosis_date), "dd/MM/yyyy")}
${diag.cid_code ? `CID: ${diag.cid_code}` : ''}

DESCRIÇÃO:
${diag.description}

═══════════════════════════════════════
Instituto Integra
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diagnostico_${patientName.replace(/\s+/g, '_')}_${diag.diagnosis_date}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Diagnóstico exportado!' });
  };

  const startEdit = (diag: any) => {
    setEditing(diag);
    setForm({ diagnosis_date: diag.diagnosis_date, description: diag.description, cid_code: diag.cid_code || '' });
    setOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Diagnósticos</CardTitle>
        <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger asChild><Button size="sm" className="gap-1"><Plus className="h-3.5 w-3.5" />Novo Diagnóstico</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? 'Editar' : 'Novo'} Diagnóstico</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Data</Label><Input type="date" value={form.diagnosis_date} onChange={e => setForm({ ...form, diagnosis_date: e.target.value })} /></div>
                <div className="space-y-2"><Label>CID (opcional)</Label><Input value={form.cid_code} onChange={e => setForm({ ...form, cid_code: e.target.value })} placeholder="Ex: F41.1" /></div>
              </div>
              <div className="space-y-2"><Label>Descrição do Diagnóstico</Label><Textarea rows={6} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <Button onClick={handleSave} className="w-full" disabled={!form.description}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {diagnoses.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">Nenhum diagnóstico registrado.</p>
        ) : (
          <div className="space-y-3">
            {diagnoses.map(d => (
              <div key={d.id} className="border border-border/60 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{format(new Date(d.diagnosis_date), "dd/MM/yyyy")}</span>
                    {d.cid_code && <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">CID: {d.cid_code}</span>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(d)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => generatePDF(d)}><FileDown className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
                <p className="text-sm whitespace-pre-wrap">{d.description}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
