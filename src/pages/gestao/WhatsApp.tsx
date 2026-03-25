import { useState, useCallback } from 'react';
import { ConversationList } from '@/components/whatsapp/ConversationList';
import { ChatPanel } from '@/components/whatsapp/ChatPanel';
import { EmptyChatState } from '@/components/whatsapp/EmptyChatState';
import { QrCodeModal } from '@/components/whatsapp/QrCodeModal';
import { ZApiSettingsModal } from '@/components/whatsapp/ZApiSettingsModal';
import { mockConversations, mockMessages } from '@/components/whatsapp/mockData';
import { Conversation, ChatMessage, ConnectionStatus } from '@/components/whatsapp/types';
import { MessageSquare, Wifi, WifiOff } from 'lucide-react';

const WhatsApp = () => {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>(mockMessages);

  const currentMessages = selected ? (messagesMap[selected.id] || []) : [];

  const handleSelect = useCallback((conv: Conversation) => {
    setSelected(conv);
    setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unread: 0 } : c));
  }, []);

  const handleSendMessage = useCallback((text: string) => {
    if (!selected) return;
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      type: 'sent',
      text,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
    };
    setMessagesMap(prev => ({
      ...prev,
      [selected.id]: [...(prev[selected.id] || []), newMsg],
    }));
    setConversations(prev => prev.map(c =>
      c.id === selected.id ? { ...c, lastMessage: text, lastMessageTime: newMsg.time } : c
    ));
  }, [selected]);

  const handleConnect = useCallback(() => {
    setStatus('connecting');
    setTimeout(() => setStatus('connected'), 3000);
  }, []);

  const handleDisconnect = useCallback(() => {
    setStatus('disconnected');
  }, []);

  const handleBack = useCallback(() => {
    setSelected(null);
  }, []);

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
          {/* Desktop: Left panel always visible */}
          <div className="hidden lg:block h-full overflow-hidden border-r border-border bg-card">
            <ConversationList
              conversations={conversations}
              selectedId={selected?.id ?? null}
              onSelect={handleSelect}
            />
          </div>

          {/* Mobile: toggle between list and chat */}
          <div className="lg:hidden h-full">
            {!selected ? (
              <ConversationList
                conversations={conversations}
                selectedId={null}
                onSelect={handleSelect}
              />
            ) : (
              <ChatPanel
                conversation={selected}
                messages={currentMessages}
                onSendMessage={handleSendMessage}
                onBack={handleBack}
              />
            )}
          </div>

          {/* Desktop: Right panel */}
          <div className="hidden lg:flex flex-col h-full">
            {selected ? (
              <ChatPanel
                conversation={selected}
                messages={currentMessages}
                onSendMessage={handleSendMessage}
              />
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
