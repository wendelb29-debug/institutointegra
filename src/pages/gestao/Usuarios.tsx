import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UsersTab from '@/components/gestao/usuarios/UsersTab';
import ProfilesTab from '@/components/gestao/usuarios/ProfilesTab';
import { usePermissions } from '@/hooks/usePermissions';
import { ShieldAlert } from 'lucide-react';

export default function Usuarios() {
  const { isAdmin, isLoading } = usePermissions();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
        <ShieldAlert className="h-12 w-12" />
        <h2 className="text-xl font-semibold text-foreground">Acesso Restrito</h2>
        <p>Somente administradores podem acessar esta página.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Gestão de Usuários</h1>
        <p className="text-muted-foreground">Gerencie usuários e perfis de acesso do sistema.</p>
      </div>
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="profiles">Perfis de Acesso</TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <UsersTab />
        </TabsContent>
        <TabsContent value="profiles">
          <ProfilesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
