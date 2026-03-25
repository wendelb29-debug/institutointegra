import { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader2, Check, CheckCheck, MoreVertical, Search, Smile, Paperclip, Mic, CalendarCheck, Bell, ArrowLeft, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { Conversation, ChatMessage } from './types';
import { EmojiPicker } from './EmojiPicker';
import { AttachmentMenu } from './AttachmentMenu';
import { MediaMessage } from './MediaMessage';

interface ChatPanelProps {
  conversation: Conversation;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onSendMedia?: (file: File, type: 'image' | 'audio' | 'document') => void;
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

export const ChatPanel = ({ conversation, messages, onSendMessage, onSendMedia, onBack }: ChatPanelProps) => {
  const [newMessage, setNewMessage] = useState('');
  const [orbitLoading, setOrbitLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ file: File; type: 'image' | 'audio' | 'document'; url: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim() || sendingMessage) return;
    setSendingMessage(true);
    onSendMessage(newMessage.trim());
    setNewMessage('');
    setTimeout(() => setSendingMessage(false), 300);
  };

  const handleImproveWithAI = async () => {
    if (!newMessage.trim()) {
      toast.error('Digite uma mensagem para melhorar.');
      return;
    }
    setOrbitLoading(true);
    // Simulate AI improvement - will be replaced with real endpoint
    setTimeout(() => {
      const improvements: Record<string, string> = {
        default: `Olá! ${newMessage.charAt(0).toUpperCase() + newMessage.slice(1)}. Agradeço pela sua mensagem e fico à disposição para qualquer dúvida.`,
      };
      const original = newMessage.toLowerCase();
      let improved = improvements.default;

      if (original.includes('confirm') || original.includes('consulta')) {
        improved = 'Olá! Gostaria de confirmar sua consulta agendada. Poderia nos confirmar sua presença? Agradecemos pela preferência!';
      } else if (original.includes('horário') || original.includes('horario') || original.includes('agendar')) {
        improved = 'Olá! Temos horários disponíveis para atendê-lo(a). Gostaria de agendar para qual dia e horário? Estou à disposição para ajudá-lo(a).';
      } else if (original.includes('lembrete') || original.includes('amanhã') || original.includes('amanha')) {
        improved = 'Olá! Este é um lembrete sobre sua consulta agendada para amanhã. Caso tenha alguma dúvida ou precise reagendar, estamos à disposição. Até breve!';
      } else if (original.includes('obrigad')) {
        improved = 'Obrigado(a) pelo seu contato! Foi um prazer atendê-lo(a). Qualquer dúvida futura, não hesite em nos procurar. Desejamos saúde e bem-estar!';
      }

      setNewMessage(improved);
      setOrbitLoading(false);
      toast.success('Mensagem melhorada com Orbit AI ✨');
      inputRef.current?.focus();
    }, 1200);
  };

  const handleFileSelected = (file: File, type: 'image' | 'audio' | 'document') => {
    const url = URL.createObjectURL(file);
    setPreviewFile({ file, type, url });
    setShowAttachments(false);
  };

  const handleSendMedia = () => {
    if (previewFile && onSendMedia) {
      onSendMedia(previewFile.file, previewFile.type);
      URL.revokeObjectURL(previewFile.url);
      setPreviewFile(null);
    }
  };

  const handleCancelPreview = () => {
    if (previewFile) {
      URL.revokeObjectURL(previewFile.url);
      setPreviewFile(null);
    }
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
              {conversation.isOnline ? <span className="text-emerald-500">online</span> : 'offline'} · {conversation.phone}
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
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-[5%] py-4 space-y-2 bg-muted/20">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda. Envie a primeira!</p>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.type === 'sent' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[65%] px-3 py-2 rounded-2xl text-sm shadow-sm ${
              msg.type === 'sent'
                ? 'bg-primary text-primary-foreground rounded-br-md'
                : 'bg-card text-foreground border border-border rounded-bl-md'
            }`}>
              <MediaMessage message={msg} />
              {msg.text && <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>}
              <div className="flex items-center justify-end gap-1 mt-1">
                <span className={`text-[10px] ${msg.type === 'sent' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{msg.time}</span>
                {msg.type === 'sent' && <MessageStatus status={msg.status} />}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* File Preview */}
      {previewFile && (
        <div className="px-4 py-3 border-t border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="relative">
              {previewFile.type === 'image' && (
                <img src={previewFile.url} alt="Preview" className="h-16 w-16 rounded-lg object-cover" />
              )}
              {previewFile.type === 'audio' && (
                <div className="h-16 w-16 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Mic className="h-6 w-6 text-orange-500" />
                </div>
              )}
              {previewFile.type === 'document' && (
                <div className="h-16 w-16 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-500">{previewFile.file.name.split('.').pop()?.toUpperCase()}</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{previewFile.file.name}</p>
              <p className="text-xs text-muted-foreground">{(previewFile.file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button onClick={handleCancelPreview} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
              <X className="h-4 w-4" />
            </button>
            <button onClick={handleSendMedia} className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 flex items-end gap-2 border-t border-border bg-card relative">
        {showEmojis && (
          <EmojiPicker
            onSelect={emoji => {
              setNewMessage(prev => prev + emoji);
              inputRef.current?.focus();
            }}
            onClose={() => setShowEmojis(false)}
          />
        )}
        {showAttachments && (
          <AttachmentMenu
            onFileSelected={handleFileSelected}
            onClose={() => setShowAttachments(false)}
          />
        )}

        <button
          onClick={() => { setShowEmojis(!showEmojis); setShowAttachments(false); }}
          className={`p-2 rounded-lg hover:bg-muted transition-colors shrink-0 ${showEmojis ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <Smile className="h-5 w-5" />
        </button>
        <button
          onClick={() => { setShowAttachments(!showAttachments); setShowEmojis(false); }}
          className={`p-2 rounded-lg hover:bg-muted transition-colors shrink-0 ${showAttachments ? 'text-primary' : 'text-muted-foreground'}`}
        >
          <Paperclip className="h-5 w-5" />
        </button>

        <div className="flex-1">
          <input
            ref={inputRef}
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Digite uma mensagem"
            className="w-full px-4 py-2.5 rounded-xl text-sm bg-muted/50 text-foreground border border-border outline-none focus:ring-1 focus:ring-primary/30 placeholder:text-muted-foreground"
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            onFocus={() => { setShowEmojis(false); setShowAttachments(false); }}
          />
        </div>

        {/* Orbit AI Improve Button */}
        <button
          onClick={handleImproveWithAI}
          disabled={orbitLoading || !newMessage.trim()}
          className="p-2 rounded-lg hover:bg-muted transition-colors shrink-0 text-muted-foreground disabled:opacity-40"
          title="Melhorar com Orbit AI"
        >
          {orbitLoading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <Sparkles className="h-5 w-5" />}
        </button>

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
