import { useState } from 'react';
import { User, UserCheck, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { Conversation } from './types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AttendanceTabProps {
  conversations: Conversation[];
  currentUserId?: string;
  currentUserName?: string;
  isAdmin?: boolean;
  onAssign: (conversationPhone: string) => void;
  onFinish: (conversationPhone: string) => void;
  onReopen: (conversationPhone: string) => void;
  onSelect: (conversation: Conversation) => void;
}

const statusLabels: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  aberto: { label: 'Aberto', color: 'bg-amber-500/10 text-amber-600 border-amber-200', icon: Clock },
  em_atendimento: { label: 'Em atendimento', color: 'bg-blue-500/10 text-blue-600 border-blue-200', icon: UserCheck },
  finalizado: { label: 'Finalizado', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200', icon: CheckCircle2 },
};

export const AttendanceTab = ({ conversations, currentUserId, currentUserName, isAdmin, onAssign, onFinish, onReopen, onSelect }: AttendanceTabProps) => {
  const [filter, setFilter] = useState<'all' | 'aberto' | 'em_atendimento' | 'finalizado'>('all');

  const visible = conversations.filter(c => {
    if (!isAdmin) {
      // Attendant sees their own + unassigned
      if (c.assignedTo && c.assignedTo !== currentUserId) return false;
    }
    if (filter === 'all') return true;
    return c.conversationStatus === filter;
  });

  const counts = {
    aberto: conversations.filter(c => c.conversationStatus === 'aberto').length,
    em_atendimento: conversations.filter(c => c.conversationStatus === 'em_atendimento').length,
    finalizado: conversations.filter(c => c.conversationStatus === 'finalizado').length,
  };

  const filters = [
    { key: 'all' as const, label: 'Todas' },
    { key: 'aberto' as const, label: `Abertas (${counts.aberto})` },
    { key: 'em_atendimento' as const, label: `Em atendimento (${counts.em_atendimento})` },
    { key: 'finalizado' as const, label: `Finalizadas (${counts.finalizado})` },
  ];

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Painel de Atendimento</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {isAdmin ? 'Visão administrativa — todas as conversas' : `Suas conversas e não atribuídas`}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 px-6 py-4">
        {Object.entries(statusLabels).map(([key, val]) => {
          const Icon = val.icon;
          return (
            <div key={key} className={`rounded-xl border p-3 ${val.color}`}>
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="text-xs font-medium">{val.label}</span>
              </div>
              <p className="text-2xl font-bold mt-1">{counts[key as keyof typeof counts]}</p>
            </div>
          );
        })}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 px-6 py-2">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === f.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {visible.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Nenhuma conversa neste filtro
          </div>
        )}
        {visible.map(conv => {
          const st = statusLabels[conv.conversationStatus || 'aberto'];
          const StIcon = st.icon;
          return (
            <div key={conv.id} className="flex items-center gap-3 px-6 py-3 hover:bg-muted/50 transition-colors border-b border-border/50">
              <div className="h-11 w-11 rounded-full flex items-center justify-center text-white font-medium text-sm shrink-0 overflow-hidden bg-primary/20">
                {conv.profilePicUrl ? (
                  <img src={conv.profilePicUrl} alt={conv.name} className="h-full w-full object-cover rounded-full" />
                ) : (
                  <span className="text-primary">{conv.avatarInitial}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground truncate">{conv.name}</p>
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${st.color}`}>
                    <StIcon className="h-3 w-3 mr-0.5" />
                    {st.label}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">{conv.phone}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {(!conv.assignedTo || conv.conversationStatus === 'aberto') && (
                  <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={() => onAssign(conv.phone)}>
                    <UserCheck className="h-3 w-3" />
                    Assumir
                  </Button>
                )}
                {conv.conversationStatus === 'em_atendimento' && conv.assignedTo === currentUserId && (
                  <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={() => onFinish(conv.phone)}>
                    <CheckCircle2 className="h-3 w-3" />
                    Finalizar
                  </Button>
                )}
                {conv.conversationStatus === 'finalizado' && (
                  <Button size="sm" variant="outline" className="text-xs h-7 gap-1" onClick={() => onReopen(conv.phone)}>
                    <Clock className="h-3 w-3" />
                    Reabrir
                  </Button>
                )}
                <button onClick={() => onSelect(conv)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
