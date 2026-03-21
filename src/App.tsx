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
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
