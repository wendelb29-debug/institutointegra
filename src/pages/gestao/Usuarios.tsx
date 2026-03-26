import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UsersTab from '@/components/gestao/usuarios/UsersTab';
import ProfilesTab from '@/components/gestao/usuarios/ProfilesTab';

export default function Usuarios() {
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
