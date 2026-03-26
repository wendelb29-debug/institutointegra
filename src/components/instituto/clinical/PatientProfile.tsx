import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, User, FileText, TrendingUp, Stethoscope, AlertTriangle, Package, ClipboardList, DollarSign } from 'lucide-react';
import { AIAssistantButton } from './AIAssistantButton';
import { ClinicalRecords } from './ClinicalRecords';
import { PatientEvolutions } from './PatientEvolutions';
import { PatientDiagnoses } from './PatientDiagnoses';
import { PatientAttendance } from './PatientAttendance';
import { PatientPackages } from './PatientPackages';
import { PatientAnamnesisForm } from './PatientAnamnesisForm';

interface PatientProfileProps {
  patient: any;
  onBack: () => void;
  initialTab?: string;
}

export function PatientProfile({ patient, onBack, initialTab = 'dados' }: PatientProfileProps) {
  const [absences, setAbsences] = useState(0);

  useEffect(() => {
    const fetchAbsences = async () => {
      const { count } = await supabase
        .from('patient_attendance')
        .select('*', { count: 'exact', head: true })
        .eq('patient_id', patient.id)
        .eq('status', 'faltou');
      setAbsences(count || 0);
    };
    fetchAbsences();
  }, [patient.id]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h2 className="text-xl font-display text-foreground">{patient.name}</h2>
          <p className="text-sm text-muted-foreground">{patient.phone} {patient.email && `• ${patient.email}`}</p>
        </div>
        {absences >= 3 && (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" /> {absences} faltas recentes
          </Badge>
        )}
        <div className="ml-auto">
          <AIAssistantButton
            text={JSON.stringify({ name: patient.name, phone: patient.phone, email: patient.email, absences })}
            onApply={() => {}}
            patientData={patient}
            context="paciente"
          />
        </div>
      </div>

      <Tabs defaultValue={initialTab} className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="dados" className="gap-1"><User className="h-3.5 w-3.5" />Dados</TabsTrigger>
          <TabsTrigger value="prontuario" className="gap-1"><FileText className="h-3.5 w-3.5" />Prontuário</TabsTrigger>
          <TabsTrigger value="evolucao" className="gap-1"><TrendingUp className="h-3.5 w-3.5" />Evolução</TabsTrigger>
          <TabsTrigger value="diagnostico" className="gap-1"><Stethoscope className="h-3.5 w-3.5" />Diagnóstico</TabsTrigger>
          <TabsTrigger value="faltas" className="gap-1"><AlertTriangle className="h-3.5 w-3.5" />Faltas</TabsTrigger>
          <TabsTrigger value="pacotes" className="gap-1"><Package className="h-3.5 w-3.5" />Pacotes</TabsTrigger>
          <TabsTrigger value="anamnese" className="gap-1"><ClipboardList className="h-3.5 w-3.5" />Anamnese</TabsTrigger>
        </TabsList>

        <TabsContent value="dados">
          <Card>
            <CardHeader><CardTitle className="text-base">Dados Cadastrais</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Nome:</span> {patient.name}</div>
                <div><span className="text-muted-foreground">Telefone:</span> {patient.phone}</div>
                <div><span className="text-muted-foreground">Email:</span> {patient.email || '—'}</div>
                <div><span className="text-muted-foreground">CPF:</span> {patient.cpf || '—'}</div>
                <div><span className="text-muted-foreground">Nascimento:</span> {patient.data_nascimento ? new Date(patient.data_nascimento).toLocaleDateString('pt-BR') : '—'}</div>
                <div><span className="text-muted-foreground">Sexo:</span> {patient.sexo || '—'}</div>
                <div><span className="text-muted-foreground">Estado Civil:</span> {patient.estado_civil || '—'}</div>
                <div><span className="text-muted-foreground">Profissão:</span> {patient.profissao || '—'}</div>
                <div><span className="text-muted-foreground">Convênio:</span> {patient.convenio_padrao || '—'}</div>
                <div><span className="text-muted-foreground">Plano:</span> {patient.plano_saude || '—'}</div>
                <div className="col-span-2"><span className="text-muted-foreground">Endereço:</span> {[patient.rua, patient.numero_endereco, patient.bairro, patient.cidade, patient.estado].filter(Boolean).join(', ') || '—'}</div>
                {patient.observacoes && <div className="col-span-2"><span className="text-muted-foreground">Observações:</span> {patient.observacoes}</div>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prontuario">
          <ClinicalRecords patientId={patient.id} patientName={patient.name} />
        </TabsContent>
        <TabsContent value="evolucao">
          <PatientEvolutions patientId={patient.id} />
        </TabsContent>
        <TabsContent value="diagnostico">
          <PatientDiagnoses patientId={patient.id} patientName={patient.name} />
        </TabsContent>
        <TabsContent value="faltas">
          <PatientAttendance patientId={patient.id} onUpdate={() => {
            supabase.from('patient_attendance').select('*', { count: 'exact', head: true }).eq('patient_id', patient.id).eq('status', 'faltou').then(({ count }) => setAbsences(count || 0));
          }} />
        </TabsContent>
        <TabsContent value="pacotes">
          <PatientPackages patientId={patient.id} />
        </TabsContent>
        <TabsContent value="anamnese">
          <PatientAnamnesisForm patientId={patient.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
