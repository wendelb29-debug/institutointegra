import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Conversation } from './types';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (conversation: Conversation) => void;
}

export const ConversationList = ({ conversations, selectedId, onSelect }: ConversationListProps) => {
  const [search, setSearch] = useState('');

  const filtered = conversations.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  return (
    <div className="flex flex-col h-full border-r border-border bg-card">
      {/* Search */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversa..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm bg-muted/50 border-0"
          />
        </div>
      </div>

      {/* Conversations */}
      <ScrollArea className="flex-1">
        <div className="divide-y divide-border/50">
          {filtered.map(conv => (
            <button
              key={conv.id}
              onClick={() => onSelect(conv)}
              className={`w-full text-left p-3 transition-colors hover:bg-muted/50 ${
                selectedId === conv.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">{conv.avatarInitial}</span>
                  </div>
                  {conv.isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-card" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate text-foreground">{conv.name}</p>
                    <span className={`text-[11px] shrink-0 ${conv.unread > 0 ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                      {conv.lastMessageTime}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-muted-foreground truncate pr-2">{conv.lastMessage}</p>
                    {conv.unread > 0 && (
                      <Badge className="bg-primary text-primary-foreground text-[10px] h-5 min-w-[20px] flex items-center justify-center rounded-full px-1.5">
                        {conv.unread}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="py-12 text-center text-muted-foreground text-sm">
              Nenhuma conversa encontrada
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
