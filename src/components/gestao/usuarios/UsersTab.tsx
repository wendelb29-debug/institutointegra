import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface UserForm {
  full_name: string;
  email: string;
  password: string;
  access_profile_id: string;
  status: string;
}

const emptyForm: UserForm = { full_name: '', email: '', password: '', access_profile_id: '', status: 'ativo' };

export default function UsersTab() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [showPassword, setShowPassword] = useState(false);

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await supabase.functions.invoke('manage-users', {
        body: { action: 'list' },
      });
      if (res.error) throw res.error;
      if (res.data?.error) throw new Error(res.data.error);

      const { data: profiles } = await supabase.from('profiles').select('*');
      return { users: res.data.users || [], profiles: profiles || [] };
    },
  });

  const { data: accessProfiles } = useQuery({
    queryKey: ['access-profiles'],
    queryFn: async () => {
      const { data } = await (supabase as any).from('access_profiles').select('*').order('name');
      return data || [];
    },
  });

  const manageMutation = useMutation({
    mutationFn: async ({ action, ...payload }: any) => {
      const res = await supabase.functions.invoke('manage-users', {
        body: { action, ...payload },
      });
      if (res.error) throw res.error;
      if (res.data?.error) throw new Error(res.data.error);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setDialogOpen(false);
      setEditingUser(null);
      setForm(emptyForm);
      toast.success(
        variables.action === 'delete' ? 'Usuário excluído!' :
        editingUser ? 'Usuário atualizado!' : 'Usuário criado!'
      );
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao processar'),
  });

  const openCreate = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (user: any) => {
    const profile = usersData?.profiles?.find((p: any) => p.user_id === user.id);
    setEditingUser(user);
    setForm({
      full_name: user.user_metadata?.full_name || profile?.full_name || '',
      email: user.email || '',
      password: '',
      access_profile_id: (profile as any)?.access_profile_id || '',
      status: (profile as any)?.status || 'ativo',
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.full_name || !form.email) {
      toast.error('Nome e email são obrigatórios');
      return;
    }
    if (editingUser) {
      manageMutation.mutate({
        action: 'update',
        user_id: editingUser.id,
        full_name: form.full_name,
        email: form.email,
        password: form.password || undefined,
        access_profile_id: form.access_profile_id || undefined,
        status: form.status,
      });
    } else {
      if (!form.password || form.password.length < 8) {
        toast.error('Senha é obrigatória (mín. 8 caracteres)');
        return;
      }
      manageMutation.mutate({ action: 'create', ...form });
    }
  };

  const handleDelete = (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
    manageMutation.mutate({ action: 'delete', user_id: userId });
  };

  const getUserProfile = (userId: string) =>
    usersData?.profiles?.find((p: any) => p.user_id === userId);

  const getAccessProfileName = (profileId: string) =>
    accessProfiles?.find((p: any) => p.id === profileId)?.name || '—';

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Criar Usuário
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Perfil de Acesso</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : !usersData?.users?.length ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum usuário encontrado
                </TableCell>
              </TableRow>
            ) : (
              usersData.users.map((user: any) => {
                const prof = getUserProfile(user.id);
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.user_metadata?.full_name || prof?.full_name || '—'}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {(prof as any)?.access_profile_id
                        ? getAccessProfileName((prof as any).access_profile_id)
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={(prof as any)?.status !== 'inativo' ? 'default' : 'secondary'}>
                        {(prof as any)?.status || 'ativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(user)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Editar Usuário' : 'Criar Usuário'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                placeholder="Nome completo"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="email@exemplo.com"
              />
            </div>
            <div>
              <Label>{editingUser ? 'Nova Senha (deixe vazio para manter)' : 'Senha'}</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder={editingUser ? '••••••••' : 'Mínimo 8 caracteres'}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label>Perfil de Acesso</Label>
              <Select
                value={form.access_profile_id}
                onValueChange={v => setForm(f => ({ ...f, access_profile_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um perfil..." />
                </SelectTrigger>
                <SelectContent>
                  {accessProfiles?.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={v => setForm(f => ({ ...f, status: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleSave}
              disabled={manageMutation.isPending}
              className="w-full"
            >
              {manageMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
