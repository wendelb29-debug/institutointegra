import {
  LayoutDashboard, DoorOpen, Users, FileText, DollarSign,
  Wrench, CalendarDays, GraduationCap, LogOut, Building2
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

const mainItems = [
  { title: 'Dashboard', url: '/gestao', icon: LayoutDashboard },
  { title: 'Salas', url: '/gestao/salas', icon: DoorOpen },
  { title: 'Sócios', url: '/gestao/socios', icon: Users },
  { title: 'Clientes', url: '/gestao/clientes', icon: Building2 },
  { title: 'Contratos', url: '/gestao/contratos', icon: FileText },
  { title: 'Financeiro', url: '/gestao/financeiro', icon: DollarSign },
  { title: 'Manutenção', url: '/gestao/manutencao', icon: Wrench },
  { title: 'Reservas', url: '/gestao/reservas', icon: CalendarDays },
];

const institutoItems = [
  { title: 'Instituto', url: '/gestao/instituto-gestao', icon: GraduationCap },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { signOut } = useAuth();

  const isActive = (path: string) =>
    path === '/gestao'
      ? location.pathname === '/gestao'
      : location.pathname.startsWith(path);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        {!collapsed && (
          <span className="text-xl font-display text-primary tracking-tight">Integra</span>
        )}
        {collapsed && (
          <span className="text-lg font-display text-primary">I</span>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Coworking</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} end={item.url === '/gestao'} className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-primary font-medium">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Instituto Integra</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {institutoItems.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-accent font-medium">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Sair</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
