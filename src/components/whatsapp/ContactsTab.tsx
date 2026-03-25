import { useState } from 'react';
import { Search, Plus, MessageSquare, Pencil, Trash2, User } from 'lucide-react';
import { WhatsAppContact } from './types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface ContactsTabProps {
  contacts: WhatsAppContact[];
  onSave: (contact: { phone: string; name: string; notes?: string }) => void;
  onUpdate: (id: string, data: { name: string; notes?: string }) => void;
  onDelete: (id: string) => void;
  onOpenChat: (phone: string) => void;
}

export const ContactsTab = ({ contacts, onSave, onUpdate, onDelete, onOpenChat }: ContactsTabProps) => {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editContact, setEditContact] = useState<WhatsAppContact | null>(null);
  const [form, setForm] = useState({ phone: '', name: '', notes: '' });

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  const handleSave = () => {
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error('Preencha nome e número');
      return;
    }
    if (editContact) {
      onUpdate(editContact.id, { name: form.name, notes: form.notes });
    } else {
      onSave({ phone: form.phone, name: form.name, notes: form.notes });
    }
    setForm({ phone: '', name: '', notes: '' });
    setEditContact(null);
    setModalOpen(false);
  };

  const openEdit = (c: WhatsAppContact) => {
    setEditContact(c);
    setForm({ phone: c.phone, name: c.name, notes: c.notes || '' });
    setModalOpen(true);
  };

  const openNew = () => {
    setEditContact(null);
    setForm({ phone: '', name: '', notes: '' });
    setModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Contatos salvos</h2>
        <Button size="sm" onClick={openNew} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Novo contato
        </Button>
      </div>

      {/* Search */}
      <div className="px-6 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Buscar contatos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg text-sm bg-muted/50 text-foreground border border-border outline-none focus:ring-1 focus:ring-primary/30 placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Nenhum contato encontrado
          </div>
        )}
        {filtered.map(c => (
          <div key={c.id} className="flex items-center gap-3 px-6 py-3 hover:bg-muted/50 transition-colors border-b border-border/50">
            <div className="h-11 w-11 rounded-full flex items-center justify-center bg-primary/10 text-primary shrink-0 overflow-hidden">
              {c.profilePicUrl ? (
                <img src={c.profilePicUrl} alt={c.name} className="h-full w-full object-cover rounded-full" />
              ) : (
                <User className="h-5 w-5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
              <p className="text-xs text-muted-foreground">{c.phone}</p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => onOpenChat(c.phone)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground" title="Abrir conversa">
                <MessageSquare className="h-4 w-4" />
              </button>
              <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground" title="Editar">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => onDelete(c.id)} className="p-1.5 rounded-lg hover:bg-muted text-destructive" title="Excluir">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editContact ? 'Editar contato' : 'Novo contato'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome do contato" />
            </div>
            <div className="space-y-2">
              <Label>Número</Label>
              <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="5511999999999" disabled={!!editContact} />
            </div>
            <div className="space-y-2">
              <Label>Observação</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notas sobre o contato..." rows={3} />
            </div>
            <Button onClick={handleSave} className="w-full">
              {editContact ? 'Salvar alterações' : 'Salvar contato'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
