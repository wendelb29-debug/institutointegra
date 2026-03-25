import { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader2, Check, CheckCheck, MoreVertical, Search, Smile, Paperclip, Mic } from 'lucide-react';
import { toast } from 'sonner';
import { Conversation, ChatMessage } from './types';

interface ChatPanelProps {
  conversation: Conversation;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onBack?: () => void;
}

export const ChatPanel = ({ conversation, messages, onSendMessage, onBack }: ChatPanelProps) => {
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

  const MessageStatus = ({ status }: { status?: string }) => {
    if (!status) return null;
    if (status === 'read') return <CheckCheck className="h-4 w-4" style={{ color: '#53bdeb' }} />;
    if (status === 'delivered') return <CheckCheck className="h-4 w-4" style={{ color: '#8696a0' }} />;
    return <Check className="h-4 w-4" style={{ color: '#8696a0' }} />;
  };

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: '#0b141a' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2" style={{ backgroundColor: '#202c33' }}>
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-1 mr-1 lg:hidden" style={{ color: '#aebac1' }}>
              ←
            </button>
          )}
          <div className="relative">
            <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#2a3942' }}>
              <span className="text-sm font-medium" style={{ color: '#aebac1' }}>{conversation.avatarInitial}</span>
            </div>
            {conversation.isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2" style={{ backgroundColor: '#00a884', borderColor: '#202c33' }} />
            )}
          </div>
          <div>
            <p className="text-[16px] font-normal" style={{ color: '#e9edef' }}>{conversation.name}</p>
            <p className="text-[13px]" style={{ color: conversation.isOnline ? '#00a884' : '#8696a0' }}>
              {conversation.isOnline ? 'online' : 'visto por último hoje'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-1.5 rounded-full hover:bg-white/5">
            <Search className="h-5 w-5" style={{ color: '#aebac1' }} />
          </button>
          <button className="p-1.5 rounded-full hover:bg-white/5">
            <MoreVertical className="h-5 w-5" style={{ color: '#aebac1' }} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-[6%] py-4 space-y-1"
        style={{
          backgroundColor: '#0b141a',
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='400' height='400' viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M20 20h2v2h-2zM60 20h2v2h-2zM100 20h2v2h-2zM140 20h2v2h-2zM180 20h2v2h-2zM220 20h2v2h-2zM260 20h2v2h-2zM300 20h2v2h-2zM340 20h2v2h-2zM380 20h2v2h-2zM40 40h2v2h-2zM80 40h2v2h-2zM120 40h2v2h-2zM160 40h2v2h-2zM200 40h2v2h-2zM240 40h2v2h-2zM280 40h2v2h-2zM320 40h2v2h-2zM360 40h2v2h-2z'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.type === 'sent' ? 'justify-end' : 'justify-start'}`}>
            <div
              className="max-w-[65%] px-2.5 py-1.5 rounded-lg text-[14.2px] relative shadow-sm"
              style={{
                backgroundColor: msg.type === 'sent' ? '#005c4b' : '#202c33',
                color: '#e9edef',
                borderTopLeftRadius: msg.type === 'received' ? '0' : undefined,
                borderTopRightRadius: msg.type === 'sent' ? '0' : undefined,
              }}
            >
              <p className="leading-[19px]">{msg.text}</p>
              <div className="flex items-center justify-end gap-1 mt-0.5 -mb-0.5">
                <span className="text-[11px]" style={{ color: msg.type === 'sent' ? 'rgba(255,255,255,0.6)' : '#8696a0' }}>{msg.time}</span>
                {msg.type === 'sent' && <MessageStatus status={msg.status} />}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="px-3 py-2 flex items-end gap-1" style={{ backgroundColor: '#202c33' }}>
        <button
          onClick={handleOrbitAI}
          disabled={orbitLoading}
          className="p-2.5 rounded-full hover:bg-white/5 transition-colors shrink-0"
          title="Orbit AI"
          style={{ color: orbitLoading ? '#00a884' : '#8696a0' }}
        >
          {orbitLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Bot className="h-6 w-6" />}
        </button>
        <button className="p-2.5 rounded-full hover:bg-white/5 transition-colors shrink-0" style={{ color: '#8696a0' }}>
          <Smile className="h-6 w-6" />
        </button>
        <button className="p-2.5 rounded-full hover:bg-white/5 transition-colors shrink-0" style={{ color: '#8696a0' }}>
          <Paperclip className="h-6 w-6" />
        </button>
        <div className="flex-1 mx-1">
          <input
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Digite uma mensagem"
            className="w-full px-3 py-2.5 rounded-lg text-[15px] outline-none placeholder:text-[#8696a0]"
            style={{ backgroundColor: '#2a3942', color: '#d1d7db', border: 'none' }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
        </div>
        {newMessage.trim() ? (
          <button
            onClick={handleSend}
            disabled={sendingMessage}
            className="p-2.5 rounded-full hover:bg-white/5 transition-colors shrink-0"
            style={{ color: '#8696a0' }}
          >
            {sendingMessage ? <Loader2 className="h-6 w-6 animate-spin" /> : <Send className="h-6 w-6" />}
          </button>
        ) : (
          <button className="p-2.5 rounded-full hover:bg-white/5 transition-colors shrink-0" style={{ color: '#8696a0' }}>
            <Mic className="h-6 w-6" />
          </button>
        )}
      </div>
    </div>
  );
};
