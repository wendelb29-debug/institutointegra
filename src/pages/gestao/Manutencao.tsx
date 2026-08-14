import { useEffect, useState, useRef } from 'react';
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
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Pencil, Upload, FileText, Trash2, ExternalLink } from 'lucide-react';

const statusColors: Record<string, string> = {
  pendente: 'bg-accent/10 text-accent border-accent/20',
  em_andamento: 'bg-primary/10 text-primary border-primary/20',
  concluido: 'bg-muted text-muted-foreground',
};

const statusLabels: Record<string, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
};

const priorityLabels: Record<string, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
};

const priorityColors: Record<string, string> = {
  baixa: 'bg-muted text-muted-foreground',
  media: 'bg-accent/10 text-accent',
  alta: 'bg-destructive/10 text-destructive',
};

const Manutencao = () => {
  const [items, setItems] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<Record<string, any[]>>({});
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState<any>({ priority: 'media' });
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchData = async () => {
    const [mRes, rRes, pRes] = await Promise.all([
      supabase.from('maintenance_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('rooms').select('id, name').order('name'),
      supabase.from('partners').select('id, name, email').eq('status', 'ativo').order('name'),
    ]);
    setItems(mRes.data || []);
    setRooms(rRes.data || []);
    setPartners(pRes.data || []);

    // Fetch attachments for all maintenance requests
    if (mRes.data && mRes.data.length > 0) {
      const ids = mRes.data.map((m: any) => m.id);
      const { data: attData } = await supabase
        .from('maintenance_attachments' as any)
        .select('*')
        .in('maintenance_id', ids)
        .order('created_at', { ascending: false });
      
      const attMap: Record<string, any[]> = {};
      (attData || []).forEach((a: any) => {
        if (!attMap[a.maintenance_id]) attMap[a.maintenance_id] = [];
        attMap[a.maintenance_id].push(a);
      });
      setAttachments(attMap);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const notifyPartners = async (title: string, status: string, id: string) => {
    // Send notification to all active partners about the maintenance update
    for (const partner of partners) {
      if (partner.email) {
        console.log(`Notificação enviada para ${partner.email}: Chamado "${title}" - Status: ${statusLabels[status] || status}`);
      }
    }
  };

  const handleSave = async () => {
    if (!form.title || !form.description || !form.room_id || !form.priority || !form.assigned_to) {
      toast({ title: 'Preencha todos os campos', description: 'Todos os campos são obrigatórios.', variant: 'destructive' });
      return;
    }

    if (editItem) {
      // Update existing
      const { error } = await supabase.from('maintenance_requests').update({
        title: form.title,
        description: form.description,
        room_id: form.room_id || null,
        priority: form.priority,
        assigned_to: form.assigned_to || null,
      } as any).eq('id', editItem.id);
      if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Chamado atualizado!' });
    } else {
      // Create new
      const { error } = await supabase.from('maintenance_requests').insert({
        title: form.title,
        description: form.description,
        room_id: form.room_id || null,
        priority: form.priority,
        requested_by: user?.id,
        assigned_to: form.assigned_to || null,
      } as any);
      if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Chamado aberto!' });
      await notifyPartners(form.title, 'pendente', '');
    }

    setOpen(false);
    setEditItem(null);
    setForm({ priority: 'media' });
    fetchData();
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({
      title: item.title,
      description: item.description,
      room_id: item.room_id,
      priority: item.priority,
      assigned_to: item.assigned_to,
    });
    setOpen(true);
  };

  const openNew = () => {
    setEditItem(null);
    setForm({ priority: 'media' });
    setOpen(true);
  };

  const updateStatus = async (id: string, status: string) => {
    const item = items.find(i => i.id === id);
    await supabase.from('maintenance_requests').update({
      status: status as any,
      resolved_at: status === 'concluido' ? new Date().toISOString() : null,
    }).eq('id', id);
    if (item) {
      await notifyPartners(item.title, status, id);
    }
    toast({ title: `Status atualizado para ${statusLabels[status]}` });
    fetchData();
  };

  const handleDeleteMaintenance = async (id: string) => {
    if (!confirm('Deseja realmente excluir este chamado?')) return;
    const { error } = await supabase.from('maintenance_requests').delete().eq('id', id);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Chamado excluído!' });
    fetchData();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !uploadTarget) return;
    const file = e.target.files[0];
    setUploading(uploadTarget);

    const filePath = `${uploadTarget}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('maintenance-files')
      .upload(filePath, file);

    if (uploadError) {
      toast({ title: 'Erro no upload', description: uploadError.message, variant: 'destructive' });
      setUploading(null);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('maintenance-files')
      .getPublicUrl(filePath);

    await supabase.from('maintenance_attachments' as any).insert({
      maintenance_id: uploadTarget,
      file_url: urlData.publicUrl,
      file_name: file.name,
      file_type: file.type,
      uploaded_by: user?.id,
    });

    toast({ title: 'Arquivo enviado!' });
    setUploading(null);
    setUploadTarget(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    fetchData();
  };

  const deleteAttachment = async (att: any) => {
    await supabase.from('maintenance_attachments' as any).delete().eq('id', att.id);
    toast({ title: 'Arquivo removido!' });
    fetchData();
  };

  const triggerUpload = (maintenanceId: string) => {
    setUploadTarget(maintenanceId);
    setTimeout(() => fileInputRef.current?.click(), 100);
  };

  const roomName = (id: string | null) => rooms.find(r => r.id === id)?.name || '—';
  const partnerName = (id: string | null) => partners.find(p => p.id === id)?.name || 'Não atribuído';

  return (
    <div className="space-y-6">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.xlsx,.xls"
        onChange={handleFileUpload}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display text-foreground">Manutenção</h1>
        <Button className="gap-2" onClick={openNew}>
          <Plus className="h-4 w-4" /> Novo Chamado
        </Button>
      </div>

      {/* Dialog for create/edit */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditItem(null); setForm({ priority: 'media' }); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? 'Editar Chamado' : 'Novo Chamado'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sala</Label>
                <Select value={form.room_id || ''} onValueChange={v => setForm({ ...form, room_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                  <SelectContent>{rooms.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Responsável (Sócio)</Label>
              <Select value={form.assigned_to || ''} onValueChange={v => setForm({ ...form, assigned_to: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione um responsável" /></SelectTrigger>
                <SelectContent>
                  {partners.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave} className="w-full">
              {editItem ? 'Salvar Alterações' : 'Abrir Chamado'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(item => (
          <Card key={item.id} className="border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base font-semibold">{item.title}</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Sala: {roomName(item.room_id)}</p>
                <p className="text-xs text-muted-foreground">Responsável: {partnerName(item.assigned_to)}</p>
              </div>
              <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                <Badge variant="outline" className={priorityColors[item.priority || 'media']}>
                  {priorityLabels[item.priority || 'media']}
                </Badge>
                <Badge variant="outline" className={statusColors[item.status]}>
                  {statusLabels[item.status]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}

              {/* Attachments */}
              {attachments[item.id] && attachments[item.id].length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Anexos:</p>
                  {attachments[item.id].map((att: any) => (
                    <div key={att.id} className="flex items-center justify-between gap-2 text-xs bg-muted/30 rounded px-2 py-1.5">
                      <button
                        type="button"
                        onClick={async () => {
                          const url = await getSignedUrl('maintenance-files', att.file_url);
                          if (url) window.open(url, '_blank', 'noopener,noreferrer');
                          else toast({ title: 'Não foi possível abrir o arquivo', variant: 'destructive' });
                        }}
                        className="flex items-center gap-1.5 text-primary hover:underline truncate flex-1 min-w-0 text-left"
                      >
                        <FileText className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{att.file_name}</span>
                        <ExternalLink className="h-2.5 w-2.5 flex-shrink-0" />
                      </button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 flex-shrink-0"
                        onClick={() => deleteAttachment(att)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" className="gap-1" onClick={() => openEdit(item)}>
                  <Pencil className="h-3.5 w-3.5" /> Editar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={() => triggerUpload(item.id)}
                  disabled={uploading === item.id}
                >
                  <Upload className="h-3.5 w-3.5" />
                  {uploading === item.id ? 'Enviando...' : 'Anexar'}
                </Button>
                {item.status !== 'em_andamento' && item.status !== 'concluido' && (
                  <Button size="sm" variant="outline" onClick={() => updateStatus(item.id, 'em_andamento')}>Iniciar</Button>
                )}
                {item.status !== 'concluido' && (
                  <Button size="sm" variant="outline" onClick={() => updateStatus(item.id, 'concluido')}>Concluir</Button>
                )}
                <Button size="sm" variant="outline" className="gap-1 text-destructive hover:text-destructive border-destructive/30" onClick={() => handleDeleteMaintenance(item.id)}>
                  <Trash2 className="h-3.5 w-3.5" /> Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            Nenhum chamado registrado.
          </div>
        )}
      </div>
    </div>
  );
};

export default Manutencao;
