import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from 'react-router-dom';
import { X, Send, Loader2, Paperclip, Mic, MicOff, ImagePlus, Download, StopCircle, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import helenaAvatar from '@/assets/helena-avatar.png';
import { toast } from 'sonner';

type MessageContent =
  | string
  | Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }>;

type Message = {
  role: 'user' | 'assistant';
  content: MessageContent;
  imageUrl?: string;
  fileUrl?: string;
  fileName?: string;
  audioUrl?: string;
  generatedImageUrl?: string;
};

const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content: 'Olá 😊 Como podemos ajudar hoje?\nVocê gostaria de **agendar uma consulta** ou **reservar uma sala**?',
};

const quickOptions = [
  { label: '📅 Agendar consulta', action: 'consult' },
  { label: '🏢 Reservar sala', action: 'room' },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function getTextContent(content: MessageContent): string {
  if (typeof content === 'string') return content;
  return content.filter(c => c.type === 'text').map(c => (c as any).text).join('');
}

export function HelenaChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQuickOptions, setShowQuickOptions] = useState(true);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const location = useLocation();

  useEffect(() => {
    if (hasAutoOpened) return;
    const timer = setTimeout(() => {
      setIsOpen(true);
      setHasAutoOpened(true);
    }, 10000);
    return () => clearTimeout(timer);
  }, [hasAutoOpened]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

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

  const uploadFile = async (file: File): Promise<string | null> => {
    // Files stay in the browser: no anonymous uploads to storage.
    try {
      return URL.createObjectURL(file);
    } catch (error) {
      console.error('File preview error:', error);
      return null;
    }
  };


  const sendMessage = async (text: string, action?: string, imageDataUrl?: string, fileUrl?: string, fileName?: string, audioUrl?: string) => {
    if ((!text.trim() && !imageDataUrl && !fileUrl && !audioUrl) || loading) return;

    let userContent: MessageContent = text;
    const userMsg: Message = { role: 'user', content: text };

    if (imageDataUrl) {
      userContent = [
        { type: 'text', text: text || 'Analise esta imagem' },
        { type: 'image_url', image_url: { url: imageDataUrl } },
      ];
      userMsg.content = userContent;
      userMsg.imageUrl = imageDataUrl;
    }

    if (fileUrl) {
      userMsg.fileUrl = fileUrl;
      userMsg.fileName = fileName;
      if (!imageDataUrl) {
        userMsg.content = text || `Enviei um arquivo: ${fileName}`;
      }
    }

    if (audioUrl) {
      userMsg.audioUrl = audioUrl;
      userMsg.content = text || '🎤 Áudio enviado';
    }

    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput('');
    setShowQuickOptions(false);
    setLoading(true);
    setIsTyping(true);

    try {
      const apiMessages = allMessages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const { data, error } = await supabase.functions.invoke('helena-chat', {
        body: {
          messages: apiMessages,
          currentPage: getCurrentPageContext(),
          action,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      await new Promise(r => setTimeout(r, 400));

      const assistantMsg: Message = { role: 'assistant', content: data.result };
      if (data.generatedImageUrl) {
        assistantMsg.generatedImageUrl = data.generatedImageUrl;
      }
      setMessages(prev => [...prev, assistantMsg]);
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

  const handleGenerateImage = async () => {
    const prompt = input.trim();
    if (!prompt || loading) return;

    const userMsg: Message = { role: 'user', content: `🖼️ Gerar imagem: ${prompt}` };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setShowQuickOptions(false);
    setLoading(true);
    setIsTyping(true);

    try {
      const { data, error } = await supabase.functions.invoke('helena-chat', {
        body: { generateImage: prompt },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      await new Promise(r => setTimeout(r, 400));

      const assistantMsg: Message = {
        role: 'assistant',
        content: data.result || 'Aqui está a imagem gerada! 🎨',
      };
      if (data.generatedImageUrl) {
        assistantMsg.generatedImageUrl = data.generatedImageUrl;
      }
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Image gen error:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Desculpe, não consegui gerar a imagem no momento. Tente novamente! 😊',
      }]);
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Arquivo muito grande. Máximo: 10MB');
      return;
    }

    const isImage = file.type.startsWith('image/');

    if (isImage) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const dataUrl = ev.target?.result as string;
        const publicUrl = await uploadFile(file);
        sendMessage('', undefined, dataUrl, publicUrl || undefined, file.name);
      };
      reader.readAsDataURL(file);
    } else {
      const publicUrl = await uploadFile(file);
      if (publicUrl) {
        sendMessage(`Enviei o arquivo: **${file.name}**`, undefined, undefined, publicUrl, file.name);
      } else {
        toast.error('Erro ao enviar arquivo');
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      setRecordingTime(0);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([audioBlob], `audio-${Date.now()}.webm`, { type: 'audio/webm' });
        const publicUrl = await uploadFile(file);
        if (publicUrl) {
          sendMessage('🎤 Áudio enviado', undefined, undefined, undefined, undefined, publicUrl);
        }
        if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      };

      mediaRecorder.start();
      setIsRecording(true);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch {
      toast.error('Não foi possível acessar o microfone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
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

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const renderMessageContent = (msg: Message) => {
    const text = getTextContent(msg.content);

    return (
      <div className="space-y-2">
        {msg.imageUrl && (
          <img src={msg.imageUrl} alt="Imagem enviada" className="rounded-lg max-w-full max-h-48 object-cover" />
        )}
        {msg.generatedImageUrl && (
          <div className="space-y-1">
            <img src={msg.generatedImageUrl} alt="Imagem gerada" className="rounded-lg max-w-full max-h-48 object-cover" />
            <a href={msg.generatedImageUrl} download target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
              <Download className="h-3 w-3" /> Baixar imagem
            </a>
          </div>
        )}
        {msg.fileUrl && !msg.imageUrl && (
          <a href={msg.fileUrl} download target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs bg-muted/50 px-3 py-1.5 rounded-lg hover:bg-muted transition-colors">
            <Paperclip className="h-3 w-3" />
            {msg.fileName || 'Arquivo'}
            <Download className="h-3 w-3" />
          </a>
        )}
        {msg.audioUrl && (
          <audio controls className="max-w-full h-8" src={msg.audioUrl} />
        )}
        {text && (
          msg.role === 'assistant' ? (
            <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0 [&>ul]:my-1 [&>ol]:my-1 [&>p:not(:last-child)]:mb-1.5">
              <ReactMarkdown>{text}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm">{text}</p>
          )
        )}
      </div>
    );
  };

  return (
    <>
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" className="hidden"
        accept="image/*,.pdf,.doc,.docx,.txt"
        onChange={handleFileUpload} />

      {/* Floating button */}
      {!isOpen && (
        <button onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 group animate-in fade-in slide-in-from-bottom-4 duration-500"
          aria-label="Falar com suporte">
          <div className="relative">
            <div className="h-16 w-16 rounded-full overflow-hidden border border-border shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110 bg-card flex items-center justify-center">
              <MessageSquare className="h-7 w-7 text-primary" />
            </div>
          </div>
          <div className="absolute bottom-full right-0 mb-2 whitespace-nowrap bg-card text-foreground text-xs font-medium px-3 py-1.5 rounded-full shadow-lg border border-border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Suporte Integra 💬
          </div>
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-[400px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100dvh-5rem)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full overflow-hidden border border-primary-foreground/30 bg-primary-foreground/10 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Suporte Integra</h3>
                <p className="text-xs text-primary-foreground/80 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 inline-block" />
                  Online agora
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon"
              className="h-8 w-8 rounded-full text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'assistant' && (
                  <div className="h-7 w-7 rounded-full overflow-hidden shrink-0 mt-0.5 bg-muted flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className={`rounded-2xl px-4 py-2.5 max-w-[80%] text-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-card border border-border shadow-sm rounded-bl-sm'
                }`}>
                  {renderMessageContent(msg)}
                </div>
              </div>
            ))}

            {/* Quick options */}
            {showQuickOptions && messages.length === 1 && (
              <div className="flex flex-wrap gap-2 pl-9">
                {quickOptions.map((opt, i) => (
                  <button key={i} onClick={() => handleQuickOption(opt)}
                    className="text-xs font-medium px-4 py-2 rounded-full border-2 border-primary text-primary bg-card hover:bg-primary hover:text-primary-foreground transition-all duration-200 shadow-sm">
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-2">
                <div className="h-7 w-7 rounded-full overflow-hidden shrink-0 bg-muted flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-primary" />
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

          {/* Recording indicator */}
          {isRecording && (
            <div className="flex items-center gap-2 px-4 py-2 bg-destructive/10 border-t border-border">
              <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
              <span className="text-xs text-destructive font-medium">Gravando... {formatTime(recordingTime)}</span>
              <Button size="icon" variant="ghost" className="h-7 w-7 ml-auto text-destructive" onClick={stopRecording}>
                <StopCircle className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Input area */}
          <div className="border-t border-border p-3 bg-card">
            <div className="flex gap-1.5 items-center">
              {/* Attach button */}
              <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={() => fileInputRef.current?.click()} disabled={loading || isRecording}>
                <Paperclip className="h-4 w-4" />
              </Button>

              {/* Image gen button */}
              <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={handleGenerateImage} disabled={!input.trim() || loading || isRecording}
                title="Gerar imagem com IA">
                <ImagePlus className="h-4 w-4" />
              </Button>

              {/* Text input */}
              <Input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown} placeholder="Digite sua mensagem..."
                className="flex-1 rounded-full bg-muted/30 border-border/60 text-sm h-9"
                disabled={loading || isRecording} />

              {/* Audio button */}
              <Button size="icon" variant="ghost"
                className={`h-8 w-8 shrink-0 ${isRecording ? 'text-destructive' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={isRecording ? stopRecording : startRecording} disabled={loading}>
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>

              {/* Send button */}
              <Button size="icon" className="h-8 w-8 rounded-full shrink-0"
                onClick={() => sendMessage(input)} disabled={!input.trim() || loading || isRecording}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              Suporte ao Cliente • Instituto Integra
            </p>
          </div>
        </div>
      )}
    </>
  );
}
