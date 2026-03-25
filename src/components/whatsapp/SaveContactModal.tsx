import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface SaveContactModalProps {
  phone: string;
  currentName?: string;
  onSave: (data: { phone: string; name: string; notes?: string }) => void;
}

export const SaveContactModal = ({ phone, currentName, onSave }: SaveContactModalProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentName || '');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ phone, name: name.trim(), notes: notes.trim() || undefined });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) setName(currentName || ''); }}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted text-foreground hover:bg-muted/80 transition-colors">
          <UserPlus className="h-3.5 w-3.5" />
          <span className="hidden xl:inline">Salvar contato</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Salvar contato</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Número</Label>
            <Input value={phone} disabled />
          </div>
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nome do contato" />
          </div>
          <div className="space-y-2">
            <Label>Observação</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas..." rows={2} />
          </div>
          <Button onClick={handleSave} className="w-full" disabled={!name.trim()}>Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
