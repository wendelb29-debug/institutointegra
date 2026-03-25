import { useState } from 'react';
import { UserPlus, X } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface NewConversationModalProps {
  onStartConversation: (phone: string, name?: string) => void;
}

export const NewConversationModal = ({ onStartConversation }: NewConversationModalProps) => {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');

  const handleStart = () => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10) return;
    onStartConversation(cleaned, name.trim() || undefined);
    setPhone('');
    setName('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="gap-1.5 text-xs text-primary hover:text-primary">
          <UserPlus className="h-4 w-4" />
          <span className="hidden sm:inline">Nova conversa</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Nova Conversa
          </DialogTitle>
          <DialogDescription>
            Digite o número com DDD para iniciar uma conversa.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="phone">Número (com DDD)</Label>
            <Input
              id="phone"
              placeholder="55 11 99999-9999"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleStart()}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Nome (opcional)</Label>
            <Input
              id="name"
              placeholder="Nome do contato"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleStart()}
            />
          </div>
          <Button onClick={handleStart} className="w-full gap-2" disabled={phone.replace(/\D/g, '').length < 10}>
            <UserPlus className="h-4 w-4" />
            Iniciar Conversa
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
