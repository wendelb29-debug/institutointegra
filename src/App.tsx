import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Coworking from "./pages/Coworking";
import Instituto from "./pages/Instituto";
import Contato from "./pages/Contato";
import ReservasPublicas from "./pages/ReservasPublicas";
import Auth from "./pages/Auth";
import AssinarContrato from "./pages/AssinarContrato";
import NotFound from "./pages/NotFound";
import GestaoLayout from "./components/gestao/GestaoLayout";
import Dashboard from "./pages/gestao/Dashboard";
import Salas from "./pages/gestao/Salas";
import Socios from "./pages/gestao/Socios";
import Clientes from "./pages/gestao/Clientes";
import Contratos from "./pages/gestao/Contratos";
import Financeiro from "./pages/gestao/Financeiro";
import Manutencao from "./pages/gestao/Manutencao";
import Reservas from "./pages/gestao/Reservas";
import InstitutoGestao from "./pages/gestao/InstitutoGestao";
import WhatsAppGestao from "./pages/gestao/WhatsApp";
import Agenda from "./pages/gestao/Agenda";
import DocumentosModelo from "./pages/gestao/cadastros/DocumentosModelo";
import Contas from "./pages/gestao/cadastros/Contas";

import FormasPagamento from "./pages/gestao/cadastros/FormasPagamento";
import Fornecedores from "./pages/gestao/cadastros/Fornecedores";
import Materiais from "./pages/gestao/cadastros/Materiais";

import Pacientes from "./pages/gestao/cadastros/Pacientes";
import PlanosSaude from "./pages/gestao/cadastros/PlanosSaude";
import Procedimentos from "./pages/gestao/cadastros/Procedimentos";
import ProfissionaisSaude from "./pages/gestao/cadastros/ProfissionaisSaude";
import Secretarias from "./pages/gestao/cadastros/Secretarias";
import CaixaClinica from "./pages/gestao/financeiro/CaixaClinica";
import CaixaProfissionais from "./pages/gestao/financeiro/CaixaProfissionais";
import ContasPagar from "./pages/gestao/financeiro/ContasPagar";
import ContasReceber from "./pages/gestao/financeiro/ContasReceber";
import Orcamentos from "./pages/gestao/financeiro/Orcamentos";
import VendasPage from "./pages/gestao/financeiro/Vendas";
import NFSe from "./pages/gestao/financeiro/NFSe";
import AlmoxEntradas from "./pages/gestao/almoxarifado/Entradas";
import AlmoxEstoque from "./pages/gestao/almoxarifado/Estoque";
import AlmoxPedidos from "./pages/gestao/almoxarifado/Pedidos";
import AlmoxSaidas from "./pages/gestao/almoxarifado/Saidas";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/coworking" element={<Coworking />} />
            <Route path="/instituto" element={<Instituto />} />
            <Route path="/contato" element={<Contato />} />
            <Route path="/reservas" element={<ReservasPublicas />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/assinar" element={<AssinarContrato />} />
            <Route path="/gestao" element={<GestaoLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="salas" element={<Salas />} />
              <Route path="socios" element={<Socios />} />
              <Route path="clientes" element={<Clientes />} />
              <Route path="contratos" element={<Contratos />} />
              <Route path="financeiro" element={<Financeiro />} />
              <Route path="manutencao" element={<Manutencao />} />
              <Route path="reservas" element={<Reservas />} />
              <Route path="instituto-gestao" element={<InstitutoGestao />} />
              <Route path="whatsapp" element={<WhatsAppGestao />} />
              <Route path="agenda" element={<Agenda />} />
              <Route path="cadastros/documentos-modelo" element={<DocumentosModelo />} />
              <Route path="cadastros/contas" element={<Contas />} />
              
              <Route path="cadastros/formas-pagamento" element={<FormasPagamento />} />
              <Route path="cadastros/fornecedores" element={<Fornecedores />} />
              <Route path="cadastros/materiais" element={<Materiais />} />
              <Route path="cadastros/status-agenda" element={<StatusAgenda />} />
              <Route path="cadastros/pacientes" element={<Pacientes />} />
              <Route path="cadastros/planos-saude" element={<PlanosSaude />} />
              <Route path="cadastros/procedimentos" element={<Procedimentos />} />
              <Route path="cadastros/profissionais" element={<ProfissionaisSaude />} />
              <Route path="cadastros/secretarias" element={<Secretarias />} />
              <Route path="financeiro/caixa-clinica" element={<CaixaClinica />} />
              <Route path="financeiro/caixa-profissionais" element={<CaixaProfissionais />} />
              <Route path="financeiro/contas-pagar" element={<ContasPagar />} />
              <Route path="financeiro/contas-receber" element={<ContasReceber />} />
              <Route path="financeiro/orcamentos" element={<Orcamentos />} />
              <Route path="financeiro/vendas" element={<VendasPage />} />
              <Route path="financeiro/nfse" element={<NFSe />} />
              <Route path="almoxarifado/entradas" element={<AlmoxEntradas />} />
              <Route path="almoxarifado/estoque" element={<AlmoxEstoque />} />
              <Route path="almoxarifado/pedidos" element={<AlmoxPedidos />} />
              <Route path="almoxarifado/saidas" element={<AlmoxSaidas />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
