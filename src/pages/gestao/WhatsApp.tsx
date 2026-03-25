import { useState, useCallback } from 'react';
import { Zap, Bot } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ConversationList } from '@/components/whatsapp/ConversationList';
import { ChatPanel } from '@/components/whatsapp/ChatPanel';
import { EmptyChatState } from '@/components/whatsapp/EmptyChatState';
import { QrCodeModal } from '@/components/whatsapp/QrCodeModal';
import { mockConversations, mockMessages } from '@/components/whatsapp/mockData';
import { Conversation, ChatMessage, ConnectionStatus } from '@/components/whatsapp/types';

const WhatsApp = () => {
  const [status, setStatus] = useState<ConnectionStatus>('connected');
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>(mockMessages);

  const currentMessages = selected ? (messagesMap[selected.id] || []) : [];

  const handleSelect = useCallback((conv: Conversation) => {
    setSelected(conv);
    // Clear unread
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-display text-foreground flex items-center gap-2">
                Orbit Inbox
                <Badge variant="outline" className="text-[10px] font-normal gap-1 border-accent/30 text-accent">
                  <Bot className="h-3 w-3" /> AI
                </Badge>
              </h1>
              <p className="text-xs text-muted-foreground">
                Central Inteligente de Conversas
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:block">
            Gerencie atendimentos e automatize conversas com IA
          </span>
          <QrCodeModal status={status} onConnect={handleConnect} onDisconnect={handleDisconnect} />
        </div>
      </div>

      {/* Chat Layout */}
      <div className="border border-border rounded-xl overflow-hidden shadow-sm bg-card" style={{ height: 'calc(100vh - 180px)', minHeight: '500px' }}>
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] h-full">
          {/* Left — Conversation List */}
          <div className="hidden lg:block h-full overflow-hidden">
            <ConversationList
              conversations={conversations}
              selectedId={selected?.id ?? null}
              onSelect={handleSelect}
            />
          </div>

          {/* Mobile conversation list */}
          <div className="lg:hidden">
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
              />
            )}
          </div>

          {/* Right — Chat */}
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
