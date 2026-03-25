import { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader2, Check, CheckCheck, MoreVertical, Search, Smile, Paperclip, Mic, CalendarCheck, Bell, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Conversation, ChatMessage } from './types';

interface ChatPanelProps {
  conversation: Conversation;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onBack?: () => void;
}

const avatarColors: Record<string, string> = {};
const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-violet-500', 'bg-cyan-500', 'bg-pink-500', 'bg-indigo-500'];
function getColor(id: string) {
  if (!avatarColors[id]) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    avatarColors[id] = colors[Math.abs(hash) % colors.length];
  }
  return avatarColors[id];
}

export const ChatPanel = ({ conversation, messages, onSendMessage, onBack }: ChatPanelProps) => {
  const [newMessage, setNewMessage] = useState('');
  const [orbitLoading, setOrbitLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sendingMessage) return;
    setSendingMessage(true);
    onSendMessage(newMessage.trim());
    setNewMessage('');
    setTimeout(() => setSendingMessage(false), 300);
  };

  const handleOrbitAI = async () => {
    const lastReceived = [...messages].reverse().find(m => m.type === 'received');
    if (!lastReceived) { toast.error('Nenhuma mensagem recebida para responder.'); return; }
    setOrbitLoading(true);
    setTimeout(() => {
      const aiResponses = [
        'Olá! Entendi sua solicitação. Posso ajudar a agendar um horário que seja conveniente para você. Temos disponibilidade nas terças e quintas. Qual horário prefere?',
        'Claro! Vou verificar as opções disponíveis e retorno em instantes. Obrigado pela preferência!',
        'Perfeito! Sua consulta está confirmada. Enviarei um lembrete 24h antes. Qualquer dúvida, estou à disposição.',
      ];
      setNewMessage(aiResponses[Math.floor(Math.random() * aiResponses.length)]);
      setOrbitLoading(false);
      toast.success('Orbit AI gerou uma sugestão de resposta.');
    }, 1500);
  };

  const handleConfirmConsulta = () => {
    onSendMessage('Olá! Estamos confirmando sua consulta. Poderia nos confirmar sua presença?');
    toast.success('Mensagem de confirmação enviada!');
  };

  const handleSendLembrete = () => {
    onSendMessage('Lembrete: você tem uma consulta agendada amanhã. Qualquer dúvida estamos à disposição.');
    toast.success('Lembrete enviado!');
  };

  const MessageStatus = ({ status }: { status?: string }) => {
    if (!status) return null;
    if (status === 'read') return <CheckCheck className="h-3.5 w-3.5 text-blue-500" />;
    if (status === 'delivered') return <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />;
    return <Check className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-1 mr-1 lg:hidden text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div className="relative">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-medium text-sm ${getColor(conversation.id)}`}>
              {conversation.avatarInitial}
            </div>
            {conversation.isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{conversation.name}</p>
            <p className="text-xs text-muted-foreground">
              {conversation.isOnline ? <span className="text-emerald-500">online</span> : 'visto por último hoje'} · {conversation.phone}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleConfirmConsulta}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <CalendarCheck className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">Confirmar</span>
          </button>
          <button
            onClick={handleSendLembrete}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted text-foreground hover:bg-muted/80 transition-colors"
          >
            <Bell className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">Lembrete</span>
          </button>
          <button className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
            <Search className="h-4 w-4" />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-[6%] py-4 space-y-2 bg-muted/20">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.type === 'sent' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[65%] px-3 py-2 rounded-2xl text-sm shadow-sm ${
              msg.type === 'sent'
                ? 'bg-primary text-primary-foreground rounded-br-md'
                : 'bg-card text-foreground border border-border rounded-bl-md'
            }`}>
              <p className="leading-relaxed">{msg.text}</p>
              <div className="flex items-center justify-end gap-1 mt-1">
                <span className={`text-[10px] ${msg.type === 'sent' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{msg.time}</span>
                {msg.type === 'sent' && <MessageStatus status={msg.status} />}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="px-4 py-3 flex items-end gap-2 border-t border-border bg-card">
        <button
          onClick={handleOrbitAI}
          disabled={orbitLoading}
          className="p-2 rounded-lg hover:bg-muted transition-colors shrink-0 text-muted-foreground"
          title="Responder com Orbit AI"
        >
          {orbitLoading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <Bot className="h-5 w-5" />}
        </button>
        <button className="p-2 rounded-lg hover:bg-muted transition-colors shrink-0 text-muted-foreground">
          <Smile className="h-5 w-5" />
        </button>
        <button className="p-2 rounded-lg hover:bg-muted transition-colors shrink-0 text-muted-foreground">
          <Paperclip className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <input
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Digite uma mensagem"
            className="w-full px-4 py-2.5 rounded-xl text-sm bg-muted/50 text-foreground border border-border outline-none focus:ring-1 focus:ring-primary/30 placeholder:text-muted-foreground"
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          />
        </div>
        {newMessage.trim() ? (
          <button onClick={handleSend} disabled={sendingMessage} className="p-2 rounded-lg hover:bg-muted transition-colors shrink-0 text-primary">
            {sendingMessage ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        ) : (
          <button className="p-2 rounded-lg hover:bg-muted transition-colors shrink-0 text-muted-foreground">
            <Mic className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};
