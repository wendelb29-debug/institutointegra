import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Pencil, Trash2, Shield } from 'lucide-react';
import { toast } from 'sonner';

const MODULES = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'instituto', label: 'Instituto' },
  { key: 'coworking', label: 'Coworking' },
  { key: 'cadastros', label: 'Cadastros' },
  { key: 'financeiro', label: 'Financeiro' },
  { key: 'almoxarifado', label: 'Almoxarifado' },
  { key: 'agenda', label: 'Agenda' },
  { key: 'contratos', label: 'Contratos' },
  { key: 'reservas', label: 'Reservas' },
  { key: 'manutencao', label: 'Manutenção' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'equipe', label: 'Equipe' },
  { key: 'socios', label: 'Sócios' },
  { key: 'clientes', label: 'Clientes' },
];

const ACTIONS = [
  { key: 'can_view', label: 'Ver' },
  { key: 'can_create', label: 'Criar' },
  { key: 'can_edit', label: 'Editar' },
  { key: 'can_delete', label: 'Excluir' },
];

type PermMap = Record<string, Record<string, boolean>>;

export default function ProfilesTab() {
  const queryClient = useQueryClient();
  const db = supabase as any;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<any>(null);
  const [name, setName] = useState('');
  const [perms, setPerms] = useState<PermMap>({});

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['access-profiles'],
    queryFn: async () => {
      const { data } = await db.from('access_profiles').select('*').order('created_at');
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingProfile) {
        await db.from('access_profiles').update({ name }).eq('id', editingProfile.id);
        await db.from('profile_permissions').delete().eq('profile_id', editingProfile.id);
        const rows = MODULES.map(m => ({
          profile_id: editingProfile.id,
          module: m.key,
          can_view: perms[m.key]?.can_view ?? false,
          can_create: perms[m.key]?.can_create ?? false,
          can_edit: perms[m.key]?.can_edit ?? false,
          can_delete: perms[m.key]?.can_delete ?? false,
        }));
        await db.from('profile_permissions').insert(rows);
      } else {
        const { data: newProfile } = await db.from('access_profiles').insert({ name }).select().single();
        if (newProfile) {
          const rows = MODULES.map(m => ({
            profile_id: newProfile.id,
            module: m.key,
            can_view: perms[m.key]?.can_view ?? false,
            can_create: perms[m.key]?.can_create ?? false,
            can_edit: perms[m.key]?.can_edit ?? false,
            can_delete: perms[m.key]?.can_delete ?? false,
          }));
          await db.from('profile_permissions').insert(rows);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-profiles'] });
      setDialogOpen(false);
      toast.success(editingProfile ? 'Perfil atualizado!' : 'Perfil criado!');
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao salvar'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await db.from('access_profiles').delete().eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-profiles'] });
      toast.success('Perfil excluído!');
    },
    onError: (err: any) => toast.error(err.message || 'Erro ao excluir'),
  });

  const openCreate = () => {
    setEditingProfile(null);
    setName('');
    setPerms({});
    setDialogOpen(true);
  };

  const openEdit = async (profile: any) => {
    setEditingProfile(profile);
    setName(profile.name);
    const { data: existingPerms } = await db
      .from('profile_permissions')
      .select('*')
      .eq('profile_id', profile.id);
    const map: PermMap = {};
    (existingPerms || []).forEach((p: any) => {
      map[p.module] = {
        can_view: p.can_view,
        can_create: p.can_create,
        can_edit: p.can_edit,
        can_delete: p.can_delete,
      };
    });
    setPerms(map);
    setDialogOpen(true);
  };

  const togglePerm = (module: string, action: string) => {
    setPerms(prev => ({
      ...prev,
      [module]: {
        ...prev[module],
        [action]: !(prev[module]?.[action] ?? false),
      },
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Criar Perfil
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : !profiles?.length ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  Nenhum perfil encontrado
                </TableCell>
              </TableRow>
            ) : (
              profiles.map((profile: any) => (
                <TableRow key={profile.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <span className="font-medium">{profile.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{profile.is_system ? 'Sistema' : 'Personalizado'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(profile)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {!profile.is_system && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm('Excluir este perfil?')) deleteMutation.mutate(profile.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingProfile ? 'Editar Perfil' : 'Criar Perfil'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome do Perfil</Label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Financeiro, Atendente..."
              />
            </div>
            <div>
              <Label className="mb-2 block">Permissões por Módulo</Label>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Módulo</TableHead>
                      {ACTIONS.map(a => (
                        <TableHead key={a.key} className="text-center w-16">
                          {a.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MODULES.map(m => (
                      <TableRow key={m.key}>
                        <TableCell className="font-medium">{m.label}</TableCell>
                        {ACTIONS.map(a => (
                          <TableCell key={a.key} className="text-center">
                            <Checkbox
                              checked={perms[m.key]?.[a.key] ?? false}
                              onCheckedChange={() => togglePerm(m.key, a.key)}
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !name.trim()}
              className="w-full"
            >
              {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
