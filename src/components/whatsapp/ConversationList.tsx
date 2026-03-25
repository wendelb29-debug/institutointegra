import { useState } from 'react';
import { Search, Filter, MessageCircle, Eye, Users } from 'lucide-react';
import { Conversation, ConversationFilter } from './types';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (conversation: Conversation) => void;
}

const filterOptions: { key: ConversationFilter; label: string; icon: typeof Users }[] = [
  { key: 'all', label: 'Todos', icon: Users },
  { key: 'unread', label: 'Não lidas', icon: MessageCircle },
  { key: 'attending', label: 'Em atendimento', icon: Eye },
];

export const ConversationList = ({ conversations, selectedId, onSelect }: ConversationListProps) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ConversationFilter>('all');

  const filtered = conversations.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search);
    if (!matchesSearch) return false;
    if (filter === 'unread') return c.unread > 0;
    if (filter === 'attending') return c.status === 'attending';
    return true;
  });

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: '#111b21' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: '#202c33' }}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#2a3942' }}>
            <span className="text-sm font-medium" style={{ color: '#aebac1' }}>Eu</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full hover:bg-white/5 transition-colors">
            <Filter className="h-5 w-5" style={{ color: '#aebac1' }} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-2 py-1.5" style={{ backgroundColor: '#111b21' }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#8696a0' }} />
          <input
            placeholder="Pesquisar por nome ou número"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-1.5 rounded-lg text-sm outline-none placeholder:text-[#8696a0]"
            style={{ backgroundColor: '#202c33', color: '#d1d7db', border: 'none' }}
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 px-2 py-1.5">
        {filterOptions.map(opt => (
          <button
            key={opt.key}
            onClick={() => setFilter(opt.key)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium transition-colors"
            style={{
              backgroundColor: filter === opt.key ? '#00a884' : '#202c33',
              color: filter === opt.key ? '#111b21' : '#8696a0',
            }}
          >
            <opt.icon className="h-3 w-3" />
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
            className="w-full text-left px-3 py-3 transition-colors flex items-center gap-3 hover:bg-[#202c33]"
            style={{
              backgroundColor: selectedId === conv.id ? '#2a3942' : 'transparent',
            }}
          >
            <div className="relative shrink-0">
              <div
                className="h-12 w-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#2a3942' }}
              >
                <span className="text-base font-medium" style={{ color: '#aebac1' }}>{conv.avatarInitial}</span>
              </div>
              {conv.isOnline && (
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2" style={{ backgroundColor: '#00a884', borderColor: '#111b21' }} />
              )}
            </div>
            <div className="min-w-0 flex-1 border-b" style={{ borderColor: '#222d34', paddingBottom: '12px' }}>
              <div className="flex items-center justify-between">
                <p className="text-[15px] font-normal truncate" style={{ color: '#e9edef' }}>{conv.name}</p>
                <span className="text-[12px] shrink-0" style={{ color: conv.unread > 0 ? '#00a884' : '#8696a0' }}>
                  {conv.lastMessageTime}
                </span>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-[13px] truncate pr-2" style={{ color: '#8696a0' }}>
                  {conv.phone} · {conv.lastMessage}
                </p>
                {conv.unread > 0 && (
                  <span
                    className="text-[11px] font-medium h-5 min-w-[20px] flex items-center justify-center rounded-full px-1.5"
                    style={{ backgroundColor: '#00a884', color: '#111b21' }}
                  >
                    {conv.unread}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm" style={{ color: '#8696a0' }}>
            Nenhuma conversa encontrada
          </div>
        )}
      </div>
    </div>
  );
};
