import { useState, useCallback, useEffect, useRef } from 'react';
import { ConversationList } from '@/components/whatsapp/ConversationList';
import { ChatPanel } from '@/components/whatsapp/ChatPanel';
import { EmptyChatState } from '@/components/whatsapp/EmptyChatState';
import { QrCodeModal } from '@/components/whatsapp/QrCodeModal';
import { InstanceSettingsModal } from '@/components/whatsapp/InstanceSettingsModal';
import { ZApiSettingsModal } from '@/components/whatsapp/ZApiSettingsModal';
import { ContactsTab } from '@/components/whatsapp/ContactsTab';
import { AttendanceTab } from '@/components/whatsapp/AttendanceTab';
import { Conversation, ChatMessage, ConnectionStatus, WhatsAppContact, OrbitTab } from '@/components/whatsapp/types';
import { MessageSquare, Wifi, WifiOff, Inbox, Users, Headphones } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';

const WhatsApp = () => {
  const { user } = useAuth();
  const { isAdmin } = usePermissions();
  const [activeTab, setActiveTab] = useState<OrbitTab>('inbox');
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [contacts, setContacts] = useState<WhatsAppContact[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const selectedRef = useRef<Conversation | null>(null);

  useEffect(() => { selectedRef.current = selected; }, [selected]);

  const getProxyUrl = () => {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'pktpabruwkvpesqqinxx';
    return `https://${projectId}.supabase.co/functions/v1/zapi-proxy`;
  };

  const getHeaders = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    };
  }, []);

  // Check Z-API status
  const checkStatus = useCallback(async () => {
    try {
      const headers = await getHeaders();
      const res = await fetch(getProxyUrl(), { method: 'POST', headers, body: JSON.stringify({ action: 'status' }) });
      const data = await res.json();
      setStatus(data.connected ? 'connected' : 'disconnected');
    } catch { setStatus('disconnected'); }
  }, [getHeaders]);

  useEffect(() => { checkStatus(); }, [checkStatus]);

  // ===== CONVERSATIONS =====
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
      profilePicUrl: (c as any).profile_pic_url || c.avatar_url || undefined,
      assignedTo: (c as any).assigned_to || null,
      conversationStatus: ((c as any).conversation_status || 'aberto') as 'aberto' | 'em_atendimento' | 'finalizado',
    })));
    setLoading(false);
  }, []);

  // ===== MESSAGES =====
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
      time: new Date(m.created_at!).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      status: m.status === 'read' ? 'read' as const : m.status === 'delivered' ? 'delivered' as const : 'sent' as const,
    })));
  }, []);

  // ===== CONTACTS =====
  const loadContacts = useCallback(async () => {
    const { data, error } = await supabase
      .from('whatsapp_contacts')
      .select('*')
      .order('name', { ascending: true });

    if (error) { console.error('Error loading contacts:', error); return; }

    setContacts((data || []).map(c => ({
      id: c.id,
      phone: c.phone,
      name: c.name,
      profilePicUrl: c.profile_pic_url || undefined,
      notes: c.notes || undefined,
      createdAt: c.created_at || undefined,
      updatedAt: c.updated_at || undefined,
    })));
  }, []);

  useEffect(() => { loadConversations(); loadContacts(); }, [loadConversations, loadContacts]);

  // ===== REALTIME =====
  useEffect(() => {
    const channel = supabase
      .channel('whatsapp-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_conversations' }, () => loadConversations())
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_contacts' }, () => loadContacts())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loadConversations, loadMessages, loadContacts]);

  // ===== HANDLERS =====
  const handleSelect = useCallback(async (conv: Conversation) => {
    setSelected(conv);
    setActiveTab('inbox');
    await loadMessages(conv.phone);
    await supabase.from('whatsapp_conversations').update({ unread_count: 0 }).eq('phone', conv.phone);
  }, [loadMessages]);

  const handleSendMessage = useCallback(async (text: string) => {
    if (!selected) return;
    try {
      const cleanPhone = selected.phone.replace(/\D/g, '');
      const headers = await getHeaders();
      const res = await fetch(getProxyUrl(), {
        method: 'POST', headers,
        body: JSON.stringify({ action: 'send', phone: cleanPhone, message: text }),
      });
      const data = await res.json();
      if (data.error) { toast.error('Erro ao enviar: ' + data.error); return; }

      setMessages(prev => [...prev, {
        id: Date.now().toString(), type: 'sent', text,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), status: 'sent',
      }]);

      await supabase.from('whatsapp_messages').insert({
        conversation_phone: selected.phone, direction: 'sent', body: text, status: 'sent', from_me: true,
        user_id: user?.id || null,
      } as any);
      await supabase.from('whatsapp_conversations').upsert({
        phone: selected.phone, name: selected.name,
        last_message: text, last_message_time: new Date().toISOString(), updated_at: new Date().toISOString(),
      } as any, { onConflict: 'phone,tenant_id' });
    } catch (err) {
      toast.error('Erro ao enviar mensagem');
      console.error(err);
    }
  }, [selected, getHeaders, user]);

  const handleSendMedia = useCallback(async (_file: File, _type: 'image' | 'audio' | 'document') => {
    if (!selected) return;
    toast.info('Envio de mídia será integrado com Z-API em breve.');
  }, [selected]);

  const handleNewConversation = useCallback(async (phone: string, name?: string) => {
    const { error } = await supabase.from('whatsapp_conversations').upsert({
      phone, name: name || phone,
      last_message: '', last_message_time: new Date().toISOString(), updated_at: new Date().toISOString(),
      assigned_to: user?.id || null,
    } as any, { onConflict: 'phone,tenant_id' });
    if (error) { toast.error('Erro ao criar conversa'); return; }
    await loadConversations();
    const { data } = await supabase.from('whatsapp_conversations').select('*').eq('phone', phone).single();
    if (data) {
      const conv: Conversation = {
        id: data.id, name: data.name || data.phone, phone: data.phone,
        lastMessage: '', lastMessageTime: '', unread: 0,
        avatarInitial: (data.name || data.phone).charAt(0).toUpperCase(),
        isOnline: false, status: 'all', conversationStatus: 'aberto',
      };
      setSelected(conv);
      setMessages([]);
    }
    toast.success('Conversa criada!');
  }, [loadConversations]);

  // ===== CONTACTS HANDLERS =====
  const handleSaveContact = useCallback(async (data: { phone: string; name: string; notes?: string }) => {
    const { error } = await supabase.from('whatsapp_contacts').upsert({
      phone: data.phone, name: data.name, notes: data.notes || null,
      user_id: user?.id || null,
    } as any, { onConflict: 'phone' });
    if (error) { toast.error('Erro ao salvar contato'); return; }
    toast.success('Contato salvo!');
    loadContacts();
  }, [loadContacts, user]);

  const handleUpdateContact = useCallback(async (id: string, data: { name: string; notes?: string }) => {
    const { error } = await supabase.from('whatsapp_contacts').update({
      name: data.name, notes: data.notes || null, updated_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) { toast.error('Erro ao atualizar contato'); return; }
    toast.success('Contato atualizado!');
    loadContacts();
  }, [loadContacts]);

  const handleDeleteContact = useCallback(async (id: string) => {
    const { error } = await supabase.from('whatsapp_contacts').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir contato'); return; }
    toast.success('Contato excluído!');
    loadContacts();
  }, [loadContacts]);

  const handleOpenChatFromContact = useCallback(async (phone: string) => {
    await handleNewConversation(phone);
    setActiveTab('inbox');
  }, [handleNewConversation]);

  // ===== ATTENDANCE HANDLERS =====
  const handleAssign = useCallback(async (phone: string) => {
    if (!user) return;
    await supabase.from('whatsapp_conversations').update({
      assigned_to: user.id, conversation_status: 'em_atendimento',
    } as any).eq('phone', phone);
    toast.success('Conversa assumida!');
    loadConversations();
  }, [user, loadConversations]);

  const handleFinish = useCallback(async (phone: string) => {
    await supabase.from('whatsapp_conversations').update({
      conversation_status: 'finalizado', assigned_to: null,
    } as any).eq('phone', phone);
    toast.success('Conversa finalizada!');
    loadConversations();
  }, [loadConversations]);

  const handleDeleteConversation = useCallback(async (phone: string) => {
    await supabase.from('whatsapp_messages').delete().eq('conversation_phone', phone);
    await supabase.from('whatsapp_conversations').delete().eq('phone', phone);
    if (selected?.phone === phone) { setSelected(null); setMessages([]); }
    toast.success('Conversa excluída!');
    loadConversations();
  }, [loadConversations, selected]);

  const handleReopen = useCallback(async (phone: string) => {
    await supabase.from('whatsapp_conversations').update({
      conversation_status: 'aberto', assigned_to: null,
    } as any).eq('phone', phone);
    toast.success('Conversa reaberta!');
    loadConversations();
  }, [loadConversations]);

  const handleTransfer = useCallback(async (phone: string, newUserId: string) => {
    await supabase.from('whatsapp_conversations').update({
      assigned_to: newUserId, conversation_status: 'em_atendimento',
    } as any).eq('phone', phone);
    toast.success('Conversa transferida!');
    loadConversations();
  }, [loadConversations]);

  const handleConnect = useCallback(async () => {
    setStatus('connecting');
    await checkStatus();
  }, [checkStatus]);

  const handleDisconnect = useCallback(async () => {
    try {
      const headers = await getHeaders();
      await fetch(getProxyUrl(), { method: 'POST', headers, body: JSON.stringify({ action: 'disconnect' }) });
      setStatus('disconnected');
    } catch { setStatus('disconnected'); }
  }, [getHeaders]);

  const handleBack = useCallback(() => { setSelected(null); }, []);

  const tabs: { key: OrbitTab; label: string; icon: typeof Inbox }[] = [
    { key: 'inbox', label: 'Inbox', icon: Inbox },
    { key: 'contacts', label: 'Contatos', icon: Users },
    { key: 'attendance', label: 'Atendimento', icon: Headphones },
  ];

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-background -m-4 md:-m-8 -mb-4 md:-mb-8 overflow-hidden" style={{ maxHeight: 'calc(100dvh - 3.5rem)' }}>
      {/* Tabs + Actions */}
      <div className="flex items-center justify-between border-b border-border bg-card px-2">
        <div className="flex gap-0">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <InstanceSettingsModal onConfigSaved={checkStatus} />
              <ZApiSettingsModal />
            </>
          )}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {status === 'connected' ? <Wifi className="h-3.5 w-3.5 text-emerald-500" /> : <WifiOff className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{status === 'connected' ? 'Conectado' : 'Desconectado'}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden bg-muted/30">
        {activeTab === 'inbox' && (
          <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] h-full min-h-0">
            <div className="hidden lg:block h-full overflow-hidden border-r border-border bg-card">
              <ConversationList conversations={conversations} selectedId={selected?.id ?? null} onSelect={handleSelect} onNewConversation={handleNewConversation} onDeleteConversation={!isAdmin ? handleDeleteConversation : undefined} currentUserId={user?.id} isAdmin={isAdmin} />
            </div>
            <div className="lg:hidden h-full">
              {!selected ? (
                <ConversationList conversations={conversations} selectedId={null} onSelect={handleSelect} onNewConversation={handleNewConversation} currentUserId={user?.id} isAdmin={isAdmin} />
              ) : (
                <ChatPanel conversation={selected} messages={messages} onSendMessage={handleSendMessage} onSendMedia={handleSendMedia} onBack={handleBack} onSaveContact={handleSaveContact} onAssign={handleAssign} onTransfer={handleTransfer} />
              )}
            </div>
            <div className="hidden lg:flex flex-col h-full">
              {selected ? (
                <ChatPanel conversation={selected} messages={messages} onSendMessage={handleSendMessage} onSendMedia={handleSendMedia} onSaveContact={handleSaveContact} onAssign={handleAssign} onTransfer={handleTransfer} />
              ) : (
                <EmptyChatState />
              )}
            </div>
          </div>
        )}

        {activeTab === 'contacts' && (
          <ContactsTab
            contacts={contacts}
            onSave={handleSaveContact}
            onUpdate={handleUpdateContact}
            onDelete={handleDeleteContact}
            onOpenChat={handleOpenChatFromContact}
          />
        )}

        {activeTab === 'attendance' && (
          <AttendanceTab
            conversations={conversations}
            currentUserId={user?.id}
            currentUserName={user?.email}
            isAdmin={isAdmin}
            onAssign={handleAssign}
            onFinish={handleFinish}
            onReopen={handleReopen}
            onSelect={handleSelect}
          />
        )}
      </div>
    </div>
  );
};

export default WhatsApp;
