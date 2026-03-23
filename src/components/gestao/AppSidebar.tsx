import {
  LayoutDashboard, DoorOpen, Users, FileText, DollarSign,
  Wrench, CalendarDays, GraduationCap, LogOut, Building2, MessageCircle, Stethoscope,
  ClipboardList, CreditCard, Handshake, Truck, Package, Clock, HeartPulse, Scissors, UserCog, UserCheck,
  Landmark, Settings, Receipt, ShoppingCart, FileCheck,
  ArrowDownToLine, Warehouse, ClipboardCheck, ArrowUpFromLine, ChevronDown
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
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
        <Collapsible defaultOpen={mainItems.some(i => isActive(i.url))}>
          <SidebarGroup>
            <CollapsibleTrigger className="flex w-full items-center justify-between px-2 py-1.5 text-xs uppercase tracking-wider text-muted-foreground/60 font-semibold hover:text-muted-foreground transition-colors cursor-pointer">
              <span className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {!collapsed && 'Coworking'}
              </span>
              {!collapsed && <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200" />}
            </CollapsibleTrigger>
            <CollapsibleContent>
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
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        <Collapsible defaultOpen={institutoItems.some(i => isActive(i.url))}>
          <SidebarGroup>
            <CollapsibleTrigger className="flex w-full items-center justify-between px-2 py-1.5 text-xs uppercase tracking-wider text-muted-foreground/60 font-semibold hover:text-muted-foreground transition-colors cursor-pointer">
              <span className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                {!collapsed && 'Instituto'}
              </span>
              {!collapsed && <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200" />}
            </CollapsibleTrigger>
            <CollapsibleContent>
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
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        <Collapsible defaultOpen={cadastroItems.some(i => isActive(i.url))}>
          <SidebarGroup>
            <CollapsibleTrigger className="flex w-full items-center justify-between px-2 py-1.5 text-xs uppercase tracking-wider text-muted-foreground/60 font-semibold hover:text-muted-foreground transition-colors cursor-pointer">
              <span className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                {!collapsed && 'Cadastros'}
              </span>
              {!collapsed && <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200" />}
            </CollapsibleTrigger>
            <CollapsibleContent>
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
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        <Collapsible defaultOpen={financeiroItems.some(i => isActive(i.url))}>
          <SidebarGroup>
            <CollapsibleTrigger className="flex w-full items-center justify-between px-2 py-1.5 text-xs uppercase tracking-wider text-muted-foreground/60 font-semibold hover:text-muted-foreground transition-colors cursor-pointer">
              <span className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                {!collapsed && 'Financeiro'}
              </span>
              {!collapsed && <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200" />}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {financeiroItems.map(item => (
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
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        <Collapsible defaultOpen={almoxarifadoItems.some(i => isActive(i.url))}>
          <SidebarGroup>
            <CollapsibleTrigger className="flex w-full items-center justify-between px-2 py-1.5 text-xs uppercase tracking-wider text-muted-foreground/60 font-semibold hover:text-muted-foreground transition-colors cursor-pointer">
              <span className="flex items-center gap-2">
                <Warehouse className="h-4 w-4" />
                {!collapsed && 'Almoxarifado'}
              </span>
              {!collapsed && <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200" />}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {almoxarifadoItems.map(item => (
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
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
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
