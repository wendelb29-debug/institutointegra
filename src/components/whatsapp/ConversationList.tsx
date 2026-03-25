import { useState } from 'react';
import { Search, Filter, Plus, User } from 'lucide-react';
import { Conversation, ConversationFilter } from './types';
import { NewConversationModal } from './NewConversationModal';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (conversation: Conversation) => void;
  onNewConversation?: (phone: string, name?: string) => void;
  currentUserId?: string;
}

const filterOptions: { key: ConversationFilter; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'mine', label: 'Minhas' },
  { key: 'unassigned', label: 'Não atribuídas' },
  { key: 'finished', label: 'Finalizadas' },
];

const avatarColors = [
  'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500',
  'bg-violet-500', 'bg-cyan-500', 'bg-pink-500', 'bg-indigo-500',
];

function getAvatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export const ConversationList = ({ conversations, selectedId, onSelect, onNewConversation, currentUserId }: ConversationListProps) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ConversationFilter>('all');

  const filtered = conversations.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search);
    if (!matchesSearch) return false;
    if (filter === 'mine') return c.assignedTo === currentUserId;
    if (filter === 'unassigned') return !c.assignedTo;
    if (filter === 'finished') return c.conversationStatus === 'finalizado';
    if (filter === 'unread') return c.unread > 0;
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Conversas</h2>
        <div className="flex items-center gap-1">
          {onNewConversation && (
            <NewConversationModal onStartConversation={onNewConversation} />
          )}
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Pesquisar contatos ou canais"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg text-sm bg-muted/50 text-foreground border border-border outline-none focus:ring-1 focus:ring-primary/30 placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 px-3 py-1.5 flex-wrap">
        {filterOptions.map(opt => (
          <button
            key={opt.key}
            onClick={() => setFilter(opt.key)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === opt.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {filtered.map(conv => (
          <button
            key={conv.id}
            onClick={() => onSelect(conv)}
            className={`w-full text-left px-3 py-3 transition-colors flex items-center gap-3 hover:bg-muted/50 ${
              selectedId === conv.id ? 'bg-muted' : ''
            }`}
          >
            <div className="relative shrink-0">
              {conv.profilePicUrl ? (
                <img src={conv.profilePicUrl} alt={conv.name} className="h-11 w-11 rounded-full object-cover" />
              ) : (
                <div className={`h-11 w-11 rounded-full flex items-center justify-center text-white font-medium text-sm ${getAvatarColor(conv.id)}`}>
                  {conv.avatarInitial}
                </div>
              )}
              {conv.isOnline && (
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />
              )}
            </div>
            <div className="min-w-0 flex-1 border-b border-border pb-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium truncate text-foreground">{conv.name}</p>
                <span className={`text-[11px] shrink-0 ${conv.unread > 0 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                  {conv.lastMessageTime}
                </span>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-xs truncate pr-2 text-muted-foreground">{conv.lastMessage}</p>
                {conv.unread > 0 && (
                  <span className="text-[10px] font-semibold h-5 min-w-[20px] flex items-center justify-center rounded-full px-1.5 bg-primary text-primary-foreground">
                    {conv.unread}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            {conversations.length === 0 ? 'Nenhuma conversa ainda' : 'Nenhuma conversa encontrada'}
          </div>
        )}
      </div>
    </div>
  );
};
