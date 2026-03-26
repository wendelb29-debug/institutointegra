import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowRightLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TeamMember {
  user_id: string;
  full_name: string;
}

interface TransferDialogProps {
  conversationPhone: string;
  currentAssignedTo?: string | null;
  onTransfer: (phone: string, newUserId: string) => void;
}

export const TransferDialog = ({ conversationPhone, currentAssignedTo, onTransfer }: TransferDialogProps) => {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      const { data } = await supabase.from('profiles').select('user_id, full_name');
      setMembers((data || []).filter(m => m.user_id !== currentAssignedTo));
    };
    load();
  }, [open, currentAssignedTo]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted text-foreground hover:bg-muted/80 transition-colors"
          title="Transferir conversa"
        >
          <ArrowRightLeft className="h-3.5 w-3.5" />
          <span className="hidden xl:inline">Transferir</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transferir conversa</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 pt-2">
          <p className="text-sm text-muted-foreground">Selecione o profissional que receberá esta conversa:</p>
          {members.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">Nenhum outro membro disponível.</p>
          )}
          {members.map(m => (
            <Button
              key={m.user_id}
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                onTransfer(conversationPhone, m.user_id);
                setOpen(false);
              }}
            >
              {m.full_name || 'Sem nome'}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
