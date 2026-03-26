import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { UserPlus, Mail, Shield, Users, Building2 } from 'lucide-react';

interface TeamMember {
  id: string;
  user_id: string;
  full_name: string;
  email?: string;
  phone?: string;
  status?: string;
  role?: string;
}

interface Invite {
  id: string;
  email: string;
  role: string;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
}

const Equipe = () => {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const { isAdmin } = usePermissions();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('cliente');
  const [inviteOpen, setInviteOpen] = useState(false);

  const loadMembers = useCallback(async () => {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, user_id, full_name, phone, status');

    if (!profiles) return;

    // Get roles for each member
    const memberList: TeamMember[] = [];
    for (const p of profiles) {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', p.user_id);

      memberList.push({
        ...p,
        role: roles?.[0]?.role || 'cliente',
      });
    }

    setMembers(memberList);
    setLoading(false);
  }, []);

  const loadInvites = useCallback(async () => {
    if (!tenant) return;
    const { data } = await supabase
      .from('tenant_invites' as any)
      .select('*')
      .order('created_at', { ascending: false });

    setInvites((data as unknown as Invite[]) || []);
  }, [tenant]);

  useEffect(() => {
    loadMembers();
    loadInvites();
  }, [loadMembers, loadInvites]);

  const handleInvite = async () => {
    if (!inviteEmail || !tenant) return;

    const { error } = await supabase.from('tenant_invites' as any).insert({
      tenant_id: tenant.id,
      email: inviteEmail,
      role: inviteRole,
      invited_by: user?.id,
    } as any);

    if (error) {
      toast.error('Erro ao enviar convite: ' + error.message);
      return;
    }

    toast.success(`Convite enviado para ${inviteEmail}`);
    setInviteEmail('');
    setInviteOpen(false);
    loadInvites();
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, string> = {
      admin: 'bg-red-100 text-red-800',
      socio: 'bg-blue-100 text-blue-800',
      cliente: 'bg-green-100 text-green-800',
    };
    const labels: Record<string, string> = {
      admin: 'Administrador',
      socio: 'Sócio',
      cliente: 'Profissional',
    };
    return (
      <Badge variant="outline" className={variants[role] || ''}>
        {labels[role] || role}
      </Badge>
    );
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Acesso restrito a administradores.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" /> Equipe
          </h1>
          {tenant && (
            <p className="text-muted-foreground flex items-center gap-1 mt-1">
              <Building2 className="h-4 w-4" /> {tenant.name}
            </p>
          )}
        </div>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button><UserPlus className="h-4 w-4 mr-2" /> Convidar Membro</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Convidar novo membro</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="email@exemplo.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Perfil de acesso</label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="socio">Sócio</SelectItem>
                    <SelectItem value="cliente">Profissional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                O convidado receberá acesso ao sistema ao criar uma conta com este email.
              </p>
              <Button onClick={handleInvite} className="w-full">
                <Mail className="h-4 w-4 mr-2" /> Enviar Convite
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Membros da equipe</CardTitle>
          <CardDescription>
            {members.length} membro{members.length !== 1 ? 's' : ''} no seu workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">
                    {m.full_name || 'Sem nome'}
                    {m.user_id === user?.id && (
                      <span className="text-xs text-muted-foreground ml-2">(você)</span>
                    )}
                  </TableCell>
                  <TableCell>{m.phone || '—'}</TableCell>
                  <TableCell>{getRoleBadge(m.role || 'cliente')}</TableCell>
                  <TableCell>
                    <Badge variant={m.status === 'ativo' ? 'default' : 'secondary'}>
                      {m.status || 'ativo'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pending Invites */}
      {invites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5" /> Convites pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Enviado em</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>{inv.email}</TableCell>
                    <TableCell>{getRoleBadge(inv.role)}</TableCell>
                    <TableCell>
                      {new Date(inv.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      {inv.accepted_at ? (
                        <Badge variant="default">Aceito</Badge>
                      ) : new Date(inv.expires_at) < new Date() ? (
                        <Badge variant="destructive">Expirado</Badge>
                      ) : (
                        <Badge variant="secondary">Pendente</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Equipe;
