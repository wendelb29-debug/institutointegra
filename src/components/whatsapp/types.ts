export interface Conversation {
  id: string;
  name: string;
  phone: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
  avatarInitial: string;
  isOnline?: boolean;
  status?: 'all' | 'unread' | 'attending';
}

export interface ChatMessage {
  id: string;
  type: 'sent' | 'received';
  text: string;
  time: string;
  status?: 'sent' | 'delivered' | 'read';
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';
export type ConversationFilter = 'all' | 'unread' | 'attending';
