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
import { generateClinicalPdf } from '@/lib/generateClinicalPdf';

interface Props {
  patientId: string;
  patientName: string;
}

export function PatientDiagnoses({ patientId, patientName }: Props) {
  const [diagnoses, setDiagnoses] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ diagnosis_date: new Date().toISOString().split('T')[0], description: '', cid_code: '' });
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);
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

  const handleGeneratePdf = async (diag: any) => {
    if (!user) return;
    setGeneratingPdf(diag.id);
    try {
      const { data: prof } = await supabase
        .from('health_professionals' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const professional = prof ? {
        full_name: (prof as any).full_name,
        specialty: (prof as any).specialty,
        registration_number: (prof as any).registration_number,
        signature_url: (prof as any).signature_url,
      } : {
        full_name: user.user_metadata?.full_name || user.email || 'Profissional',
        specialty: '',
      };

      const blob = await generateClinicalPdf({
        type: 'diagnostico',
        patientName,
        professional,
        content: [{ date: diag.diagnosis_date, text: diag.description }],
        diagnosisCid: diag.cid_code || undefined,
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `diagnostico_${patientName.replace(/\s+/g, '_')}_${diag.diagnosis_date}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'PDF do diagnóstico gerado!' });
    } catch {
      toast({ title: 'Erro ao gerar PDF', variant: 'destructive' });
    }
    setGeneratingPdf(null);
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
              <div className="space-y-2">
                <Label>Descrição do Diagnóstico</Label>
                <Textarea rows={6} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                <div className="flex gap-2 flex-wrap">
                  <AIAssistantButton
                    text={form.description}
                    onApply={(result) => setForm({ ...form, description: result })}
                    patientData={{ name: patientName }}
                    context="diagnostico"
                    compact
                  />
                  <TemplatesPanel
                    onInsert={(text) => setForm({ ...form, description: form.description ? form.description + '\n\n' + text : text })}
                    context="diagnostico"
                  />
                </div>
              </div>
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
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleGeneratePdf(d)}
                      disabled={generatingPdf === d.id}
                    >
                      <FileDown className="h-3.5 w-3.5" />
                    </Button>
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
