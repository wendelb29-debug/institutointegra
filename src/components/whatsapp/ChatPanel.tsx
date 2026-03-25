import { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader2, Check, CheckCheck, Phone, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Conversation, ChatMessage } from './types';

interface ChatPanelProps {
  conversation: Conversation;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
}

export const ChatPanel = ({ conversation, messages, onSendMessage }: ChatPanelProps) => {
  const [newMessage, setNewMessage] = useState('');
  const [orbitLoading, setOrbitLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
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
    if (!lastReceived) {
      toast.error('Nenhuma mensagem recebida para responder.');
      return;
    }

    setOrbitLoading(true);
    // Simulating AI response — ready for POST /chat integration
    setTimeout(() => {
      const aiResponses = [
        'Olá! Entendi sua solicitação. Posso ajudar a agendar um horário que seja conveniente para você. Temos disponibilidade nas terças e quintas. Qual horário prefere?',
        'Claro! Vou verificar as opções disponíveis e retorno em instantes. Obrigado pela preferência!',
        'Perfeito! Sua consulta está confirmada. Enviarei um lembrete 24h antes. Qualquer dúvida, estou à disposição.',
      ];
      const response = aiResponses[Math.floor(Math.random() * aiResponses.length)];
      setNewMessage(response);
      setOrbitLoading(false);
      toast.success('Orbit AI gerou uma sugestão de resposta.');
    }, 1500);
  };

  const MessageStatus = ({ status }: { status?: string }) => {
    if (!status) return null;
    if (status === 'read') return <CheckCheck className="h-3.5 w-3.5 text-sky-500" />;
    if (status === 'delivered') return <CheckCheck className="h-3.5 w-3.5 text-muted-foreground/60" />;
    return <Check className="h-3.5 w-3.5 text-muted-foreground/60" />;
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">{conversation.avatarInitial}</span>
            </div>
            {conversation.isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-card" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{conversation.name}</p>
            <p className="text-xs text-muted-foreground">
              {conversation.isOnline ? (
                <span className="text-emerald-600">Online</span>
              ) : (
                conversation.phone
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-2"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}
      >
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.type === 'sent' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm shadow-sm ${
                msg.type === 'sent'
                  ? 'bg-primary text-primary-foreground rounded-br-md'
                  : 'bg-card text-foreground border border-border rounded-bl-md'
              }`}
            >
              <p className="leading-relaxed">{msg.text}</p>
              <div className={`flex items-center justify-end gap-1 mt-1 ${msg.type === 'sent' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                <span className="text-[10px]">{msg.time}</span>
                {msg.type === 'sent' && <MessageStatus status={msg.status} />}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border bg-card">
        <div className="flex items-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOrbitAI}
            disabled={orbitLoading}
            className="shrink-0 gap-1.5 text-xs border-accent text-accent hover:bg-accent/10 hover:text-accent"
          >
            {orbitLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bot className="h-3.5 w-3.5" />}
            Orbit AI
          </Button>
          <Textarea
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="min-h-[40px] max-h-[100px] resize-none text-sm flex-1"
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            onClick={handleSend}
            size="icon"
            disabled={!newMessage.trim() || sendingMessage}
            className="shrink-0 bg-primary hover:bg-primary/90"
          >
            {sendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};
