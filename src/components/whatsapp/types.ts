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
  profilePicUrl?: string;
  assignedTo?: string | null;
  conversationStatus?: 'aberto' | 'em_atendimento' | 'finalizado';
}

export interface ChatMessage {
  id: string;
  type: 'sent' | 'received';
  text: string;
  time: string;
  status?: 'sent' | 'delivered' | 'read';
  mediaType?: 'image' | 'audio' | 'document' | 'video';
  mediaUrl?: string;
  mediaName?: string;
  mediaMimeType?: string;
}

export interface WhatsAppContact {
  id: string;
  phone: string;
  name: string;
  profilePicUrl?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';
export type ConversationFilter = 'all' | 'unread' | 'attending' | 'mine' | 'unassigned' | 'finished';
export type OrbitTab = 'inbox' | 'contacts' | 'attendance';
