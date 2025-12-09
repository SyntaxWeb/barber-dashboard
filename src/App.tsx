import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ClientAuthProvider, useClientAuth } from "@/contexts/ClientAuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Agenda from "./pages/Agenda";
import NovoAgendamento from "./pages/NovoAgendamento";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";
import Registro from "./pages/Registro";
import ClienteRegistro from "./pages/ClienteRegistro";
import ClienteLogin from "./pages/ClienteLogin";
import ClienteAgendamento from "./pages/ClienteAgendamento";
import PublicAgendamento from "./pages/PublicAgendamento";

const queryClient = new QueryClient();

const ClienteProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated } = useClientAuth();
  if (!isAuthenticated) {
    return <Navigate to="/cliente/login" replace />;
  }
  return children;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <ClientAuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/registro" element={<Registro />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/agenda" element={<Agenda />} />
                <Route path="/novo-agendamento" element={<NovoAgendamento />} />
                <Route path="/configuracoes" element={<Configuracoes />} />
                <Route path="/cliente/registro" element={<ClienteRegistro />} />
                <Route path="/cliente/login" element={<ClienteLogin />} />
                <Route path="/e/:slug/agendar" element={<PublicAgendamento />} />
                <Route
                  path="/cliente/agendar"
                  element={
                    <ClienteProtectedRoute>
                      <ClienteAgendamento />
                    </ClienteProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ClientAuthProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
