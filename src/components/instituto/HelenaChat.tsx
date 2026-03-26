import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from 'react-router-dom';
import { X, Send, Loader2, Paperclip, Mic, MicOff } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import helenaAvatar from '@/assets/helena-avatar.png';

type Message = { role: 'user' | 'assistant'; content: string };

const WA_NUMBER = '5511999990000';

const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content: 'Olá 😊 eu sou a **Helena**, assistente do Instituto Integra.\nPosso te ajudar?\nVocê gostaria de **agendar uma consulta** ou **reservar uma sala**?',
};

const quickOptions = [
  { label: '📅 Agendar consulta', action: 'consult' },
  { label: '🏢 Reservar sala', action: 'room' },
];

export function HelenaChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQuickOptions, setShowQuickOptions] = useState(true);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();

  // Auto-open after 10 seconds
  useEffect(() => {
    if (hasAutoOpened) return;
    const timer = setTimeout(() => {
      setIsOpen(true);
      setHasAutoOpened(true);
    }, 10000);
    return () => clearTimeout(timer);
  }, [hasAutoOpened]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const getCurrentPageContext = useCallback(() => {
    const path = location.pathname;
    const hash = location.hash;
    if (hash.includes('servicos') || path.includes('servicos')) return 'página de serviços (terapia e estética)';
    if (hash.includes('profissionais') || path.includes('profissionais')) return 'página de profissionais';
    if (path.includes('coworking')) return 'página do coworking';
    if (path.includes('contato')) return 'página de contato';
    if (path.includes('reservas')) return 'página de reservas públicas';
    return 'página inicial do Instituto Integra';
  }, [location]);

  const sendMessage = async (text: string, action?: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput('');
    setShowQuickOptions(false);
    setLoading(true);
    setIsTyping(true);

    try {
      const { data, error } = await supabase.functions.invoke('helena-chat', {
        body: {
          messages: allMessages.map(m => ({ role: m.role, content: m.content })),
          currentPage: getCurrentPageContext(),
          action,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Simulate typing delay for natural feel
      await new Promise(r => setTimeout(r, 500));

      setMessages(prev => [...prev, { role: 'assistant', content: data.result }]);
    } catch (err: any) {
      console.error('Helena chat error:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Desculpe, estou com dificuldades no momento. Você pode falar comigo pelo WhatsApp! 😊',
      }]);
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  };

  const handleQuickOption = (option: typeof quickOptions[0]) => {
    if (option.action === 'consult') {
      sendMessage('Quero agendar uma consulta', 'list_professionals');
    } else {
      sendMessage('Quero reservar uma sala', 'list_rooms');
    }
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
          className="fixed bottom-6 right-6 z-50 group animate-in fade-in slide-in-from-bottom-4 duration-500"
          aria-label="Falar com Helena"
        >
          <div className="relative">
            <div className="h-16 w-16 rounded-full overflow-hidden border-[3px] border-primary shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110">
              <img
                src={helenaAvatar}
                alt="Helena - Assistente Virtual"
                className="w-full h-full object-cover"
                width={64}
                height={64}
              />
            </div>
            {/* Pulse indicator */}
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-primary" />
            </span>
          </div>
          {/* Label */}
          <div className="absolute bottom-full right-0 mb-2 whitespace-nowrap bg-card text-foreground text-xs font-medium px-3 py-1.5 rounded-full shadow-lg border border-border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Fale com a Helena 💬
          </div>
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[540px] max-h-[calc(100dvh-5rem)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-primary-foreground/30">
                <img
                  src={helenaAvatar}
                  alt="Helena"
                  className="w-full h-full object-cover"
                  width={40}
                  height={40}
                />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Helena</h3>
                <p className="text-xs text-primary-foreground/80 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 inline-block" />
                  Online agora
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'assistant' && (
                  <div className="h-7 w-7 rounded-full overflow-hidden shrink-0 mt-0.5">
                    <img src={helenaAvatar} alt="" className="w-full h-full object-cover" width={28} height={28} />
                  </div>
                )}
                <div className={`rounded-2xl px-4 py-2.5 max-w-[80%] text-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-card border border-border shadow-sm rounded-bl-sm'
                }`}>
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0 [&>ul]:my-1 [&>ol]:my-1 [&>p:not(:last-child)]:mb-1.5">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p>{msg.content}</p>
                  )}
                </div>
              </div>
            ))}

            {/* Quick options */}
            {showQuickOptions && messages.length === 1 && (
              <div className="flex flex-wrap gap-2 pl-9">
                {quickOptions.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickOption(opt)}
                    className="text-xs font-medium px-4 py-2 rounded-full border-2 border-primary text-primary bg-card hover:bg-primary hover:text-primary-foreground transition-all duration-200 shadow-sm"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-2">
                <div className="h-7 w-7 rounded-full overflow-hidden shrink-0">
                  <img src={helenaAvatar} alt="" className="w-full h-full object-cover" width={28} height={28} />
                </div>
                <div className="bg-card border border-border shadow-sm rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                    <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                    <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="border-t border-border p-3 bg-card">
            <div className="flex gap-2 items-center">
              <Input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem..."
                className="flex-1 rounded-full bg-muted/30 border-border/60 text-sm"
                disabled={loading}
              />
              <Button
                size="icon"
                className="h-9 w-9 rounded-full shrink-0"
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              Helena • Assistente Virtual do Instituto Integra
            </p>
          </div>
        </div>
      )}
    </>
  );
}
