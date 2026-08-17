import {
  LayoutDashboard, DoorOpen, Users, FileText, DollarSign,
  Wrench, CalendarDays, GraduationCap, LogOut, Building2, MessageCircle, Stethoscope,
  ClipboardList, CreditCard, Truck, Package, HeartPulse, UserCog,
  Landmark, Settings, Receipt, ShoppingCart, FileCheck,
  ArrowDownToLine, Warehouse, ClipboardCheck, ArrowUpFromLine, ChevronDown
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions, Module } from '@/hooks/usePermissions';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  { title: 'Pacientes', url: '/gestao/cadastros/pacientes', icon: HeartPulse },
  { title: 'WhatsApp', url: '/gestao/whatsapp', icon: MessageCircle },
];

const cadastroItems = [
  { title: 'Documentos Modelo', url: '/gestao/cadastros/documentos-modelo', icon: FileText },
  { title: 'Contas', url: '/gestao/cadastros/contas', icon: DollarSign },
  { title: 'Formas de Pagamento', url: '/gestao/cadastros/formas-pagamento', icon: CreditCard },
  { title: 'Fornecedores', url: '/gestao/cadastros/fornecedores', icon: Truck },
  { title: 'Materiais', url: '/gestao/cadastros/materiais', icon: Package },
];

const financeiroItems = [
  { title: 'Caixa da Clínica', url: '/gestao/financeiro/caixa-clinica', icon: Landmark },
  { title: 'Caixa de Profissionais', url: '/gestao/financeiro/caixa-profissionais', icon: Settings },
  { title: 'Contas a Pagar', url: '/gestao/financeiro/contas-pagar', icon: CreditCard },
  { title: 'Contas a Receber', url: '/gestao/financeiro/contas-receber', icon: Receipt },
  { title: 'Orçamentos', url: '/gestao/financeiro/orcamentos', icon: ClipboardList },
  { title: 'Vendas', url: '/gestao/financeiro/vendas', icon: ShoppingCart },
  { title: 'NFS-e', url: '/gestao/financeiro/nfse', icon: FileCheck },
];

const almoxarifadoItems = [
  { title: 'Entradas', url: '/gestao/almoxarifado/entradas', icon: ArrowDownToLine },
  { title: 'Estoque', url: '/gestao/almoxarifado/estoque', icon: Warehouse },
  { title: 'Pedidos', url: '/gestao/almoxarifado/pedidos', icon: ClipboardCheck },
  { title: 'Saídas', url: '/gestao/almoxarifado/saidas', icon: ArrowUpFromLine },
];

interface SectionConfig {
  id: string;
  label: string;
  icon: any;
  items: typeof mainItems;
  module: Module;
  activeClassName?: string;
}

const sections: SectionConfig[] = [
  { id: 'coworking', label: 'Coworking', icon: Building2, items: mainItems, module: 'coworking', activeClassName: 'sidebar-active' },
  { id: 'instituto', label: 'Instituto', icon: GraduationCap, items: institutoItems, module: 'instituto', activeClassName: 'sidebar-active' },
  { id: 'cadastros', label: 'Cadastros', icon: ClipboardList, items: cadastroItems, module: 'cadastros', activeClassName: 'sidebar-active' },
  { id: 'financeiro', label: 'Financeiro', icon: DollarSign, items: financeiroItems, module: 'financeiro', activeClassName: 'sidebar-active' },
  { id: 'almoxarifado', label: 'Almoxarifado', icon: Warehouse, items: almoxarifadoItems, module: 'almoxarifado', activeClassName: 'sidebar-active' },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { signOut } = useAuth();
  const { isAdmin, canViewModule } = usePermissions();

  const isActive = (path: string) =>
    path === '/gestao'
      ? location.pathname === '/gestao'
      : location.pathname.startsWith(path);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-5">
        <div className="flex items-center gap-2.5">
          <img src={logoIntegra} alt="Integra" className="h-8 w-auto shrink-0" />
          {!collapsed && (
            <div className="flex flex-col leading-none">
              <span className="text-base font-display text-foreground tracking-wide">Integra</span>
              <span className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground/60 mt-1">Management Console</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {sections.map(section => {
          // Special case: Coworking section is partially visible to everyone
          const isCoworking = section.id === 'coworking';
          const visible = isAdmin || canViewModule(section.module) || isCoworking;
          if (!visible) return null;

          const filteredItems = isAdmin ? section.items : section.items.filter(item => {
            if (isCoworking) {
              // Only show basic items to non-admins in Coworking section
              return ['Dashboard', 'Salas', 'Reservas'].includes(item.title);
            }
            return canViewModule(section.module);
          });

          if (filteredItems.length === 0) return null;

          return (
            <Collapsible key={section.id} defaultOpen={filteredItems.some(i => isActive(i.url))}>
              <SidebarGroup>
                <CollapsibleTrigger className="flex w-full items-center justify-between px-2 py-1.5 text-xs uppercase tracking-wider text-muted-foreground/60 font-semibold hover:text-muted-foreground transition-colors cursor-pointer">
                  <span className="flex items-center gap-2">
                    <section.icon className="h-4 w-4" />
                    {!collapsed && section.label}
                  </span>
                  {!collapsed && <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200" />}
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {filteredItems.map(item => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild isActive={isActive(item.url)}>
                            <NavLink
                              to={item.url}
                              end={item.url === '/gestao'}
                              className="hover:bg-sidebar-accent/60"
                              activeClassName={section.activeClassName || 'sidebar-active'}
                            >
                              <item.icon className="h-4 w-4" />
                              {!collapsed && <span>{item.title}</span>}
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          );
        })}

        {/* Admin-only: User Management */}
        {isAdmin && (
          <Collapsible defaultOpen={isActive('/gestao/usuarios')}>
            <SidebarGroup>
              <CollapsibleTrigger className="flex w-full items-center justify-between px-2 py-1.5 text-xs uppercase tracking-wider text-muted-foreground/60 font-semibold hover:text-muted-foreground transition-colors cursor-pointer">
                <span className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  {!collapsed && 'Configurações'}
                </span>
                {!collapsed && <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200" />}
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={isActive('/gestao/usuarios')}>
                        <NavLink to="/gestao/usuarios" className="hover:bg-sidebar-accent/60" activeClassName="sidebar-active">
                          <UserCog className="h-4 w-4" />
                          {!collapsed && <span>Usuários</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={isActive('/gestao/equipe')}>
                        <NavLink to="/gestao/equipe" className="hover:bg-sidebar-accent/60" activeClassName="sidebar-active">
                          <Users className="h-4 w-4" />
                          {!collapsed && <span>Equipe</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}
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
