import { useState, useCallback } from 'react';
import { ConversationList } from '@/components/whatsapp/ConversationList';
import { ChatPanel } from '@/components/whatsapp/ChatPanel';
import { EmptyChatState } from '@/components/whatsapp/EmptyChatState';
import { QrCodeModal } from '@/components/whatsapp/QrCodeModal';
import { ZApiSettingsModal } from '@/components/whatsapp/ZApiSettingsModal';
import { mockConversations, mockMessages } from '@/components/whatsapp/mockData';
import { Conversation, ChatMessage, ConnectionStatus } from '@/components/whatsapp/types';
import { Bot } from 'lucide-react';

const WhatsApp = () => {
  const [status, setStatus] = useState<ConnectionStatus>('connected');
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
    <div className="h-[calc(100vh-80px)] flex flex-col">
      {/* Top banner */}
      <div className="flex items-center justify-between px-4 py-2" style={{ backgroundColor: '#202c33', borderBottom: '1px solid #2a3942' }}>
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4" style={{ color: '#00a884' }} />
          <div>
            <span className="text-xs font-semibold" style={{ color: '#e9edef' }}>
              Central WhatsApp Inteligente
            </span>
            <span className="text-[10px] ml-2 hidden sm:inline" style={{ color: '#8696a0' }}>
              Gerencie pacientes, confirme consultas e automatize atendimentos com IA
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ZApiSettingsModal />
          <QrCodeModal status={status} onConnect={handleConnect} onDisconnect={handleDisconnect} />
        </div>
      </div>

      {/* Chat Layout */}
      <div className="flex-1 overflow-hidden" style={{ backgroundColor: '#111b21' }}>
        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] h-full">
          {/* Desktop: Left panel always visible */}
          <div className="hidden lg:block h-full overflow-hidden" style={{ borderRight: '1px solid #2a3942' }}>
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
