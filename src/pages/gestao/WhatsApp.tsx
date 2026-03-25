import { useState, useCallback, useEffect, useRef } from 'react';
import { ConversationList } from '@/components/whatsapp/ConversationList';
import { ChatPanel } from '@/components/whatsapp/ChatPanel';
import { EmptyChatState } from '@/components/whatsapp/EmptyChatState';
import { QrCodeModal } from '@/components/whatsapp/QrCodeModal';
import { ZApiSettingsModal } from '@/components/whatsapp/ZApiSettingsModal';
import { Conversation, ChatMessage, ConnectionStatus } from '@/components/whatsapp/types';
import { MessageSquare, Wifi, WifiOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const WhatsApp = () => {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const selectedRef = useRef<Conversation | null>(null);

  useEffect(() => { selectedRef.current = selected; }, [selected]);

  const getProxyUrl = () => {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'pktpabruwkvpesqqinxx';
    return `https://${projectId}.supabase.co/functions/v1/zapi-proxy`;
  };

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
  });

  // Check Z-API status
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(getProxyUrl(), { method: 'POST', headers: getHeaders(), body: JSON.stringify({ action: 'status' }) });
        const data = await res.json();
        setStatus(data.connected ? 'connected' : 'disconnected');
      } catch { setStatus('disconnected'); }
    };
    check();
  }, []);

  // Load conversations
  const loadConversations = useCallback(async () => {
    const { data, error } = await supabase
      .from('whatsapp_conversations')
      .select('*')
      .eq('is_group', false)
      .order('last_message_time', { ascending: false });

    if (error) { console.error('Error loading conversations:', error); return; }

    setConversations((data || []).map(c => ({
      id: c.id,
      name: c.name || c.phone,
      phone: c.phone,
      lastMessage: c.last_message || '',
      lastMessageTime: c.last_message_time
        ? new Date(c.last_message_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        : '',
      unread: c.unread_count || 0,
      avatarInitial: (c.name || c.phone).charAt(0).toUpperCase(),
      isOnline: c.is_online || false,
      status: (c.unread_count || 0) > 0 ? 'unread' : 'all' as const,
    })));
    setLoading(false);
  }, []);

  // Load messages
  const loadMessages = useCallback(async (phone: string) => {
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('conversation_phone', phone)
      .order('created_at', { ascending: true });

    if (error) { console.error('Error loading messages:', error); return; }

    setMessages((data || []).map(m => ({
      id: m.id,
      type: m.direction === 'sent' ? 'sent' as const : 'received' as const,
      text: m.body || '',
      time: new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      status: m.status === 'read' ? 'read' as const : m.status === 'delivered' ? 'delivered' as const : 'sent' as const,
    })));
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('whatsapp-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_conversations' }, () => {
        loadConversations();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'whatsapp_messages' }, (payload) => {
        const msg = payload.new as any;
        if (selectedRef.current && msg.conversation_phone === selectedRef.current.phone) {
          const newMsg: ChatMessage = {
            id: msg.id,
            type: msg.direction === 'sent' ? 'sent' : 'received',
            text: msg.body || '',
            time: new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            status: msg.status === 'read' ? 'read' : msg.status === 'delivered' ? 'delivered' : 'sent',
          };
          setMessages(prev => prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg]);
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'whatsapp_messages' }, () => {
        if (selectedRef.current) loadMessages(selectedRef.current.phone);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loadConversations, loadMessages]);

  const handleSelect = useCallback(async (conv: Conversation) => {
    setSelected(conv);
    await loadMessages(conv.phone);
    await supabase.from('whatsapp_conversations').update({ unread_count: 0 }).eq('phone', conv.phone);
  }, [loadMessages]);

  const handleSendMessage = useCallback(async (text: string) => {
    if (!selected) return;
    try {
      const res = await fetch(getProxyUrl(), {
        method: 'POST', headers: getHeaders(),
        body: JSON.stringify({ action: 'send', phone: selected.phone, message: text }),
      });
      const data = await res.json();
      if (data.error) { toast.error('Erro ao enviar: ' + data.error); return; }

      // Optimistic UI
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'sent',
        text,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        status: 'sent',
      }]);

      await supabase.from('whatsapp_messages').insert({
        conversation_phone: selected.phone, direction: 'sent', body: text, status: 'sent', from_me: true,
      });
      await supabase.from('whatsapp_conversations').upsert({
        phone: selected.phone, name: selected.name,
        last_message: text, last_message_time: new Date().toISOString(), updated_at: new Date().toISOString(),
      }, { onConflict: 'phone' });
    } catch (err) {
      toast.error('Erro ao enviar mensagem');
      console.error(err);
    }
  }, [selected]);

  const handleSendMedia = useCallback(async (file: File, type: 'image' | 'audio' | 'document') => {
    if (!selected) return;
    toast.info('Envio de mídia será integrado com Z-API em breve.');
    // Future: upload file to storage, then call zapi-proxy with media action
  }, [selected]);

  const handleNewConversation = useCallback(async (phone: string, name?: string) => {
    // Upsert conversation
    const { error } = await supabase.from('whatsapp_conversations').upsert({
      phone,
      name: name || phone,
      last_message: '',
      last_message_time: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'phone' });

    if (error) { toast.error('Erro ao criar conversa'); return; }

    await loadConversations();

    // Select the new conversation
    const { data } = await supabase.from('whatsapp_conversations').select('*').eq('phone', phone).single();
    if (data) {
      const conv: Conversation = {
        id: data.id,
        name: data.name || data.phone,
        phone: data.phone,
        lastMessage: '',
        lastMessageTime: '',
        unread: 0,
        avatarInitial: (data.name || data.phone).charAt(0).toUpperCase(),
        isOnline: false,
        status: 'all',
      };
      setSelected(conv);
      setMessages([]);
    }

    toast.success('Conversa criada!');
  }, [loadConversations]);

  const handleConnect = useCallback(async () => {
    setStatus('connecting');
    try {
      const res = await fetch(getProxyUrl(), { method: 'POST', headers: getHeaders(), body: JSON.stringify({ action: 'status' }) });
      const data = await res.json();
      setStatus(data.connected ? 'connected' : 'disconnected');
    } catch { setStatus('disconnected'); }
  }, []);

  const handleDisconnect = useCallback(async () => {
    try {
      await fetch(getProxyUrl(), { method: 'POST', headers: getHeaders(), body: JSON.stringify({ action: 'disconnect' }) });
      setStatus('disconnected');
    } catch { setStatus('disconnected'); }
  }, []);

  const handleBack = useCallback(() => { setSelected(null); }, []);

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col bg-background">
      {/* Top banner */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">Orbit Inbox</h1>
            <p className="text-xs text-muted-foreground">
              Envie mensagens, gerencie conversas e use inteligência artificial para se comunicar melhor.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ZApiSettingsModal />
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {status === 'connected' ? <Wifi className="h-3.5 w-3.5 text-emerald-500" /> : <WifiOff className="h-3.5 w-3.5" />}
            <span>{status === 'connected' ? 'Conectado' : 'Desconectado'}</span>
          </div>
          <QrCodeModal status={status} onConnect={handleConnect} onDisconnect={handleDisconnect} />
        </div>
      </div>

      {/* Chat Layout */}
      <div className="flex-1 overflow-hidden bg-muted/30">
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] h-full">
          <div className="hidden lg:block h-full overflow-hidden border-r border-border bg-card">
            <ConversationList conversations={conversations} selectedId={selected?.id ?? null} onSelect={handleSelect} onNewConversation={handleNewConversation} />
          </div>
          <div className="lg:hidden h-full">
            {!selected ? (
              <ConversationList conversations={conversations} selectedId={null} onSelect={handleSelect} onNewConversation={handleNewConversation} />
            ) : (
              <ChatPanel conversation={selected} messages={messages} onSendMessage={handleSendMessage} onSendMedia={handleSendMedia} onBack={handleBack} />
            )}
          </div>
          <div className="hidden lg:flex flex-col h-full">
            {selected ? (
              <ChatPanel conversation={selected} messages={messages} onSendMessage={handleSendMessage} onSendMedia={handleSendMedia} />
            ) : (
              <EmptyChatState />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsApp;
