import {
  LayoutDashboard, DoorOpen, Users, FileText, DollarSign,
  Wrench, CalendarDays, GraduationCap, LogOut, Building2, MessageCircle, Stethoscope,
  ClipboardList, CreditCard, Handshake, Truck, Package, Clock, HeartPulse, Scissors, UserCog, UserCheck
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
import logoIntegra from '@/assets/logo_integra.png';

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
  { title: 'Agenda', url: '/gestao/agenda', icon: Stethoscope },
  { title: 'WhatsApp', url: '/gestao/whatsapp', icon: MessageCircle },
];

const cadastroItems = [
  { title: 'Documentos Modelo', url: '/gestao/cadastros/documentos-modelo', icon: FileText },
  { title: 'Contas', url: '/gestao/cadastros/contas', icon: DollarSign },
  { title: 'Convênios', url: '/gestao/cadastros/convenios', icon: Handshake },
  { title: 'Formas de Pagamento', url: '/gestao/cadastros/formas-pagamento', icon: CreditCard },
  { title: 'Fornecedores', url: '/gestao/cadastros/fornecedores', icon: Truck },
  { title: 'Materiais', url: '/gestao/cadastros/materiais', icon: Package },
  { title: 'Status Agenda', url: '/gestao/cadastros/status-agenda', icon: Clock },
  { title: 'Pacientes', url: '/gestao/cadastros/pacientes', icon: HeartPulse },
  { title: 'Planos de Saúde', url: '/gestao/cadastros/planos-saude', icon: ClipboardList },
  { title: 'Procedimentos', url: '/gestao/cadastros/procedimentos', icon: Scissors },
  { title: 'Profissionais de Saúde', url: '/gestao/cadastros/profissionais', icon: UserCog },
  { title: 'Secretárias(os)', url: '/gestao/cadastros/secretarias', icon: UserCheck },
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
      <SidebarHeader className="border-b border-sidebar-border px-3 py-4">
        <div className="flex items-center gap-2.5">
          <img src={logoIntegra} alt="Integra" className="h-8 w-auto shrink-0" />
          {!collapsed && (
            <span className="text-lg font-display text-charcoal tracking-tight">Integra</span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/60 font-semibold">Coworking</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} end={item.url === '/gestao'} className="hover:bg-sidebar-accent/60" activeClassName="bg-primary/8 text-primary font-medium">
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
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/60 font-semibold">Instituto</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {institutoItems.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} className="hover:bg-sidebar-accent/60" activeClassName="bg-gold/8 text-gold font-medium">
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
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/60 font-semibold">Cadastros</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {cadastroItems.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} className="hover:bg-sidebar-accent/60" activeClassName="bg-primary/8 text-primary font-medium">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

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
