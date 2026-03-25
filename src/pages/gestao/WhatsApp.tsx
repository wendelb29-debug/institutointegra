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

  // Keep ref in sync
  useEffect(() => { selectedRef.current = selected; }, [selected]);

  // Check Z-API connection status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'pktpabruwkvpesqqinxx';
        const res = await fetch(`https://${projectId}.supabase.co/functions/v1/zapi-proxy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
          body: JSON.stringify({ action: 'status' }),
        });
        const data = await res.json();
        setStatus(data.connected ? 'connected' : 'disconnected');
      } catch { setStatus('disconnected'); }
    };
    checkStatus();
  }, []);

  // Load conversations from DB
  const loadConversations = useCallback(async () => {
    const { data, error } = await supabase
      .from('whatsapp_conversations')
      .select('*')
      .eq('is_group', false)
      .order('last_message_time', { ascending: false });

    if (error) { console.error('Error loading conversations:', error); return; }

    const convs: Conversation[] = (data || []).map(c => ({
      id: c.id,
      name: c.name || c.phone,
      phone: c.phone,
      lastMessage: c.last_message || '',
      lastMessageTime: c.last_message_time ? new Date(c.last_message_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '',
      unread: c.unread_count || 0,
      avatarInitial: (c.name || c.phone).charAt(0).toUpperCase(),
      isOnline: c.is_online || false,
      status: (c.unread_count || 0) > 0 ? 'unread' : 'all' as const,
    }));

    setConversations(convs);
    setLoading(false);
  }, []);

  // Load messages for selected conversation
  const loadMessages = useCallback(async (phone: string) => {
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('conversation_phone', phone)
      .order('created_at', { ascending: true });

    if (error) { console.error('Error loading messages:', error); return; }

    const msgs: ChatMessage[] = (data || []).map(m => ({
      id: m.id,
      type: m.direction === 'sent' ? 'sent' as const : 'received' as const,
      text: m.body || '',
      time: new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      status: m.status === 'read' ? 'read' as const : m.status === 'delivered' ? 'delivered' as const : 'sent' as const,
    }));

    setMessages(msgs);
  }, []);

  // Initial load
  useEffect(() => { loadConversations(); }, [loadConversations]);

  // Realtime subscriptions
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
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
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
    // Reset unread
    await supabase
      .from('whatsapp_conversations')
      .update({ unread_count: 0 })
      .eq('phone', conv.phone);
  }, [loadMessages]);

  const handleSendMessage = useCallback(async (text: string) => {
    if (!selected) return;

    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'pktpabruwkvpesqqinxx';
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/zapi-proxy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ action: 'send', phone: selected.phone, message: text }),
      });

      const data = await res.json();
      if (data.error) {
        toast.error('Erro ao enviar: ' + data.error);
        return;
      }

      // Optimistically add message to UI
      const newMsg: ChatMessage = {
        id: Date.now().toString(),
        type: 'sent',
        text,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        status: 'sent',
      };
      setMessages(prev => [...prev, newMsg]);

      // Also save to DB directly for immediate persistence
      await supabase.from('whatsapp_messages').insert({
        conversation_phone: selected.phone,
        direction: 'sent',
        body: text,
        status: 'sent',
        from_me: true,
      });

      // Update conversation
      await supabase.from('whatsapp_conversations').upsert({
        phone: selected.phone,
        name: selected.name,
        last_message: text,
        last_message_time: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'phone' });

    } catch (err) {
      toast.error('Erro ao enviar mensagem');
      console.error(err);
    }
  }, [selected]);

  const handleConnect = useCallback(async () => {
    setStatus('connecting');
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'pktpabruwkvpesqqinxx';
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/zapi-proxy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ action: 'status' }),
      });
      const data = await res.json();
      setStatus(data.connected ? 'connected' : 'disconnected');
    } catch { setStatus('disconnected'); }
  }, []);

  const handleDisconnect = useCallback(async () => {
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'pktpabruwkvpesqqinxx';
      await fetch(`https://${projectId}.supabase.co/functions/v1/zapi-proxy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ action: 'disconnect' }),
      });
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
            <h1 className="text-base font-semibold text-foreground">
              Orbit Inbox – Central Inteligente de Conversas
            </h1>
            <p className="text-xs text-muted-foreground">
              Gerencie atendimentos, responda clientes e automatize conversas com inteligência artificial.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ZApiSettingsModal />
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {status === 'connected' ? (
              <Wifi className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span>{status === 'connected' ? 'Conectado' : 'Desconectado'}</span>
          </div>
          <QrCodeModal status={status} onConnect={handleConnect} onDisconnect={handleDisconnect} />
        </div>
      </div>

      {/* Chat Layout */}
      <div className="flex-1 overflow-hidden bg-muted/30">
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] h-full">
          <div className="hidden lg:block h-full overflow-hidden border-r border-border bg-card">
            <ConversationList conversations={conversations} selectedId={selected?.id ?? null} onSelect={handleSelect} />
          </div>
          <div className="lg:hidden h-full">
            {!selected ? (
              <ConversationList conversations={conversations} selectedId={null} onSelect={handleSelect} />
            ) : (
              <ChatPanel conversation={selected} messages={messages} onSendMessage={handleSendMessage} onBack={handleBack} />
            )}
          </div>
          <div className="hidden lg:flex flex-col h-full">
            {selected ? (
              <ChatPanel conversation={selected} messages={messages} onSendMessage={handleSendMessage} />
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
