import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import {
  MessageCircle, X, Send, Loader2, Bot, User,
  CalendarPlus, UserPlus, Stethoscope, DollarSign, Sparkles
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

type Message = { role: 'user' | 'assistant'; content: string };

const quickActions = [
  { label: 'Agendar consulta', icon: <CalendarPlus className="h-3.5 w-3.5" />, route: '/gestao/agenda', prompt: 'Como faço para agendar uma consulta?' },
  { label: 'Cadastrar paciente', icon: <UserPlus className="h-3.5 w-3.5" />, route: '/gestao/cadastros/pacientes', prompt: 'Como cadastro um novo paciente?' },
  { label: 'Gerar diagnóstico', icon: <Stethoscope className="h-3.5 w-3.5" />, route: '/gestao/instituto-gestao', prompt: 'Como gero um diagnóstico com IA?' },
  { label: 'Lançar custo', icon: <DollarSign className="h-3.5 w-3.5" />, route: '/gestao/socios', prompt: 'Como lanço um custo para rateio entre sócios?' },
];

const SYSTEM_PROMPT = `Você é o assistente inteligente do sistema Integra Gestão — um sistema de gestão para clínicas (terapia e estética) e coworking.

Suas responsabilidades:
- Responder dúvidas sobre como usar o sistema
- Orientar o usuário em ações (agendar, cadastrar paciente, gerar diagnóstico, lançar custos, etc.)
- Ser conciso, amigável e profissional
- Quando o usuário perguntar como fazer algo, explique passo a passo e mencione em qual módulo do sistema ele encontra a funcionalidade

Módulos do sistema:
- Dashboard: visão geral
- Agenda: agendamentos de consultas
- Pacientes (em Cadastros): cadastro de pacientes
- Instituto Gestão: prontuário, diagnóstico, evolução, anamnese, pacotes, faltas
- Salas: gestão de salas do coworking
- Reservas: reservas de salas
- Sócios: gestão de sócios e rateio de custos
- Financeiro: contas a pagar/receber, caixa
- Contratos: gestão de contratos
- WhatsApp: comunicação com pacientes/clientes
- Manutenção: solicitações de manutenção
- Usuários: gestão de usuários e perfis de acesso

Responda sempre em português brasileiro. Seja breve e direto.`;

export function FloatingChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput('');
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat-assistant', {
        body: { messages: allMessages },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setMessages(prev => [...prev, { role: 'assistant', content: data.result }]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action: typeof quickActions[0]) => {
    sendMessage(action.prompt);
  };

  const handleNavigate = (route: string) => {
    navigate(route);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center animate-in fade-in slide-in-from-bottom-4"
          aria-label="Abrir assistente"
        >
          <Sparkles className="h-6 w-6" />
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100dvh-5rem)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Assistente Integra</h3>
                <p className="text-xs text-muted-foreground">Sempre disponível para ajudar</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Welcome message */}
            {messages.length === 0 && (
              <div className="space-y-4">
                <div className="flex gap-2.5">
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted/50 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
                    <p className="text-sm">Olá! 👋 Sou o assistente do Integra Gestão. Posso te ajudar com dúvidas sobre o sistema ou executar ações rápidas.</p>
                  </div>
                </div>

                {/* Quick actions */}
                <div className="space-y-2 pl-9">
                  <p className="text-xs text-muted-foreground font-medium">Ações rápidas:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {quickActions.map((action, i) => (
                      <button
                        key={i}
                        onClick={() => handleQuickAction(action)}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-border bg-card hover:bg-muted/50 transition-colors text-foreground"
                      >
                        {action.icon}
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Message list */}
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'assistant' && (
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className={`rounded-2xl px-4 py-3 max-w-[85%] text-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                    : 'bg-muted/50 rounded-tl-sm'
                }`}>
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0 [&>ul]:my-1 [&>ol]:my-1">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p>{msg.content}</p>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div className="flex gap-2.5">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted/50 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Pensando...
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="border-t border-border p-3">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua dúvida..."
                className="flex-1 rounded-full bg-muted/30 border-border/60"
                disabled={loading}
              />
              <Button
                size="icon"
                className="h-10 w-10 rounded-full shrink-0"
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              Powered by Integra AI • Respostas podem conter imprecisões
            </p>
          </div>
        </div>
      )}
    </>
  );
}
