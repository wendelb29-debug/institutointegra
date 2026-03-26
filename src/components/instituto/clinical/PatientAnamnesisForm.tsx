import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

export function PatientAnamnesisForm({ patientId }: { patientId: string }) {
  const [anamnesis, setAnamnesis] = useState<any>(null);
  const [form, setForm] = useState({
    queixa_principal: '', historico_doenca: '', historico_familiar: '',
    medicamentos: '', alergias: '', habitos: '', observacoes: '',
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    supabase.from('patient_anamnesis').select('*').eq('patient_id', patientId).maybeSingle().then(({ data }) => {
      if (data) {
        setAnamnesis(data);
        setForm({
          queixa_principal: data.queixa_principal || '',
          historico_doenca: data.historico_doenca || '',
          historico_familiar: data.historico_familiar || '',
          medicamentos: data.medicamentos || '',
          alergias: data.alergias || '',
          habitos: data.habitos || '',
          observacoes: data.observacoes || '',
        });
      }
    });
  }, [patientId]);

  const handleSave = async () => {
    if (!user) return;
    if (anamnesis) {
      const { error } = await supabase.from('patient_anamnesis').update(form).eq('id', anamnesis.id);
      if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    } else {
      const { error } = await supabase.from('patient_anamnesis').insert({
        patient_id: patientId, psychologist_id: user.id, ...form,
      });
      if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    }
    toast({ title: 'Anamnese salva!' });
  };

  const fields = [
    { key: 'queixa_principal', label: 'Queixa Principal' },
    { key: 'historico_doenca', label: 'Histórico da Doença Atual' },
    { key: 'historico_familiar', label: 'Histórico Familiar' },
    { key: 'medicamentos', label: 'Medicamentos em Uso' },
    { key: 'alergias', label: 'Alergias' },
    { key: 'habitos', label: 'Hábitos de Vida' },
    { key: 'observacoes', label: 'Observações Gerais' },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Anamnese</CardTitle>
        <Button size="sm" className="gap-1" onClick={handleSave}><Save className="h-3.5 w-3.5" />Salvar</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map(f => (
          <div key={f.key} className="space-y-2">
            <Label>{f.label}</Label>
            <Textarea
              rows={3}
              value={(form as any)[f.key]}
              onChange={e => setForm({ ...form, [f.key]: e.target.value })}
              placeholder={`Descreva ${f.label.toLowerCase()}...`}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
