import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Sparkles, Wand2, SpellCheck, AlignLeft, FileText,
  Stethoscope, MessageSquare, BarChart3, Loader2, Copy, Check, Lightbulb
} from 'lucide-react';

interface AIAssistantProps {
  text: string;
  onApply: (result: string) => void;
  patientData?: any;
  context?: string; // 'prontuario' | 'diagnostico' | 'paciente' | 'estetica'
  compact?: boolean;
}

type AIAction = {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
};

const actionsByContext: Record<string, AIAction[]> = {
  prontuario: [
    { id: 'organize', label: 'Organizar', icon: <AlignLeft className="h-4 w-4" />, description: 'Organiza anotações de forma estruturada' },
    { id: 'correct', label: 'Corrigir', icon: <SpellCheck className="h-4 w-4" />, description: 'Corrige erros e melhora a escrita' },
    { id: 'summarize', label: 'Resumir', icon: <FileText className="h-4 w-4" />, description: 'Resume informações principais' },
    { id: 'restructure', label: 'Reestruturar', icon: <Wand2 className="h-4 w-4" />, description: 'Reestrutura em formato clínico' },
    { id: 'improve', label: 'Melhorar', icon: <Sparkles className="h-4 w-4" />, description: 'Refina e melhora o conteúdo' },
  ],
  diagnostico: [
    { id: 'generate_diagnosis', label: 'Gerar Diagnóstico', icon: <Stethoscope className="h-4 w-4" />, description: 'Sugere diagnóstico estruturado com IA' },
    { id: 'correct', label: 'Corrigir', icon: <SpellCheck className="h-4 w-4" />, description: 'Corrige erros e melhora a escrita' },
    { id: 'format_pdf', label: 'Formatar para PDF', icon: <FileText className="h-4 w-4" />, description: 'Formata com linguagem formal' },
    { id: 'improve', label: 'Melhorar', icon: <Sparkles className="h-4 w-4" />, description: 'Refina e melhora o conteúdo' },
  ],
  paciente: [
    { id: 'analyze_patient', label: 'Analisar Paciente', icon: <BarChart3 className="h-4 w-4" />, description: 'Analisa histórico e identifica padrões' },
    { id: 'suggest_message', label: 'Gerar Mensagem', icon: <MessageSquare className="h-4 w-4" />, description: 'Sugere mensagens para o paciente' },
  ],
  estetica: [
    { id: 'suggest_protocol', label: 'Sugerir Protocolo', icon: <Lightbulb className="h-4 w-4" />, description: 'Sugere protocolo de tratamento estético' },
    { id: 'organize', label: 'Organizar', icon: <AlignLeft className="h-4 w-4" />, description: 'Organiza anotações de forma estruturada' },
    { id: 'improve', label: 'Melhorar', icon: <Sparkles className="h-4 w-4" />, description: 'Refina e melhora o conteúdo' },
  ],
};

export function AIAssistantButton({ text, onApply, patientData, context = 'prontuario', compact = false }: AIAssistantProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);
  const [messageType, setMessageType] = useState('confirmacao');
  const { toast } = useToast();

  const actions = actionsByContext[context] || actionsByContext.prontuario;

  const handleAction = async (actionId: string) => {
    if (!text.trim() && !['generate_diagnosis', 'suggest_message', 'analyze_patient', 'suggest_protocol'].includes(actionId)) {
      toast({ title: 'Texto vazio', description: 'Insira algum texto antes de usar a IA.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    setResult('');

    try {
      const { data, error } = await supabase.functions.invoke('clinical-ai', {
        body: {
          action: actionId,
          text: text || 'Sem informações disponíveis',
          patientData,
          context: { messageType },
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult(data.result);
    } catch (err: any) {
      toast({
        title: 'Erro ao processar',
        description: err.message || 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    onApply(result);
    setOpen(false);
    setResult('');
    toast({ title: 'Texto aplicado!' });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size={compact ? "sm" : "default"}
        className="gap-2 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
        onClick={() => setOpen(true)}
      >
        <Sparkles className="h-4 w-4" />
        {!compact && 'Assistente IA'}
      </Button>

      <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) setResult(''); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Assistente Inteligente
            </DialogTitle>
          </DialogHeader>

          <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 bg-amber-50 w-fit">
            ⚠️ Sugestão gerada por IA. Revisão profissional obrigatória.
          </Badge>

          <div className="space-y-4">
            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2">
              {actions.map(action => (
                <Button
                  key={action.id}
                  variant="outline"
                  size="sm"
                  className="h-auto py-3 px-3 flex flex-col items-start gap-1 text-left"
                  onClick={() => handleAction(action.id)}
                  disabled={loading}
                >
                  <div className="flex items-center gap-2 font-medium">
                    {action.icon}
                    {action.label}
                  </div>
                  <span className="text-xs text-muted-foreground font-normal">{action.description}</span>
                </Button>
              ))}
            </div>

            {/* Message type selector for suggest_message */}
            {context === 'paciente' && (
              <div className="flex gap-2">
                {[
                  { id: 'confirmacao', label: 'Confirmação' },
                  { id: 'reagendamento', label: 'Reagendamento' },
                  { id: 'pos_atendimento', label: 'Pós-atendimento' },
                ].map(t => (
                  <Button
                    key={t.id}
                    variant={messageType === t.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMessageType(t.id)}
                  >
                    {t.label}
                  </Button>
                ))}
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Processando com IA...</span>
              </div>
            )}

            {/* Result */}
            {result && (
              <div className="space-y-3">
                <div className="border border-primary/20 rounded-lg p-4 bg-primary/5">
                  <Textarea
                    value={result}
                    onChange={e => setResult(e.target.value)}
                    rows={10}
                    className="border-none bg-transparent resize-none focus-visible:ring-0 p-0"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1">
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Copiado' : 'Copiar'}
                  </Button>
                  <Button size="sm" onClick={handleApply} className="gap-1">
                    <Check className="h-3.5 w-3.5" />
                    Aplicar Texto
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
