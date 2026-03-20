import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Upload, Image as ImageIcon, Users } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Room = Database['public']['Tables']['rooms']['Row'];
type RoomInsert = Database['public']['Tables']['rooms']['Insert'];

const statusColors: Record<string, string> = {
  disponivel: 'bg-primary/10 text-primary border-primary/20',
  ocupada: 'bg-accent/10 text-accent border-accent/20',
  manutencao: 'bg-destructive/10 text-destructive border-destructive/20',
};

const statusLabels: Record<string, string> = {
  disponivel: 'Disponível',
  ocupada: 'Ocupada',
  manutencao: 'Manutenção',
};

const typeLabels: Record<string, string> = {
  hora: 'Por Hora',
  diaria: 'Diária',
  mensal: 'Mensal',
};

const Salas = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [form, setForm] = useState<Partial<RoomInsert>>({});
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const fetchRooms = async () => {
    const { data } = await supabase.from('rooms').select('*').order('name');
    setRooms(data || []);
  };

  useEffect(() => { fetchRooms(); }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const ext = file.name.split('.').pop();
    const fileName = `room-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('contract-assets')
      .upload(`rooms/${fileName}`, file, { upsert: true });

    if (uploadError) {
      toast({ title: 'Erro ao enviar imagem', description: uploadError.message, variant: 'destructive' });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('contract-assets')
      .getPublicUrl(`rooms/${fileName}`);

    setForm({ ...form, image_url: urlData.publicUrl });
    setUploading(false);
    toast({ title: 'Imagem enviada!' });
  };

  const handleSave = async () => {
    if (!form.name) return;
    if (editing) {
      const { error } = await supabase.from('rooms').update(form).eq('id', editing.id);
      if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Sala atualizada!' });
    } else {
      const { error } = await supabase.from('rooms').insert(form as RoomInsert);
      if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Sala criada!' });
    }
    setOpen(false);
    setEditing(null);
    setForm({});
    fetchRooms();
  };

  const openEdit = (room: Room) => {
    setEditing(room);
    setForm(room);
    setOpen(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ type: 'hora', status: 'disponivel' });
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display text-foreground">Salas</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Nova Sala</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Sala' : 'Nova Sala'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={form.description || ''}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Descreva a sala, equipamentos disponíveis..."
                  rows={3}
                />
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Foto da Sala</Label>
                <div className="flex items-center gap-3">
                  {form.image_url ? (
                    <img src={form.image_url} alt="Preview" className="h-20 w-28 object-cover rounded-lg border border-border/40" />
                  ) : (
                    <div className="h-20 w-28 rounded-lg border border-dashed border-border/60 flex items-center justify-center bg-muted/30">
                      <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                  )}
                  <div>
                    <label className="cursor-pointer">
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      <Button type="button" variant="outline" size="sm" className="gap-1.5" disabled={uploading} asChild>
                        <span><Upload className="h-3.5 w-3.5" /> {uploading ? 'Enviando...' : 'Enviar Foto'}</span>
                      </Button>
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={form.type || 'hora'} onValueChange={v => setForm({ ...form, type: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hora">Por Hora</SelectItem>
                      <SelectItem value="diaria">Diária</SelectItem>
                      <SelectItem value="mensal">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status || 'disponivel'} onValueChange={v => setForm({ ...form, status: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="disponivel">Disponível</SelectItem>
                      <SelectItem value="ocupada">Ocupada</SelectItem>
                      <SelectItem value="manutencao">Manutenção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>R$/hora</Label>
                  <Input type="number" value={form.price_hour ?? ''} onChange={e => setForm({ ...form, price_hour: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>R$/dia</Label>
                  <Input type="number" value={form.price_day ?? ''} onChange={e => setForm({ ...form, price_day: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>R$/mês</Label>
                  <Input type="number" value={form.price_month ?? ''} onChange={e => setForm({ ...form, price_month: Number(e.target.value) })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Capacidade</Label>
                <Input type="number" value={form.capacity ?? 1} onChange={e => setForm({ ...form, capacity: Number(e.target.value) })} />
              </div>
              <Button onClick={handleSave} className="w-full">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map(room => (
          <Card key={room.id} className="border-border/60 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            {/* Room image */}
            {room.image_url ? (
              <div className="h-40 overflow-hidden">
                <img src={room.image_url} alt={room.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="h-40 bg-gradient-to-br from-primary/8 via-primary/4 to-accent/6 flex items-center justify-center">
                <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
              </div>
            )}
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div>
                <CardTitle className="text-base font-semibold">{room.name}</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">{typeLabels[room.type]}</p>
              </div>
              <Badge variant="outline" className={statusColors[room.status]}>
                {statusLabels[room.status]}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              {room.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{room.description}</p>
              )}
              <div className="flex gap-4 text-sm text-muted-foreground">
                {Number(room.price_hour) > 0 && <span>R$ {Number(room.price_hour).toFixed(2)}/h</span>}
                {Number(room.price_day) > 0 && <span>R$ {Number(room.price_day).toFixed(2)}/dia</span>}
                {Number(room.price_month) > 0 && <span>R$ {Number(room.price_month).toFixed(2)}/mês</span>}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" /> {room.capacity} pessoa{room.capacity !== 1 ? 's' : ''}
                </span>
                <Button variant="ghost" size="sm" onClick={() => openEdit(room)} className="gap-1">
                  <Pencil className="h-3 w-3" /> Editar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {rooms.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            Nenhuma sala cadastrada. Clique em "Nova Sala" para começar.
          </div>
        )}
      </div>
    </div>
  );
};

export default Salas;
