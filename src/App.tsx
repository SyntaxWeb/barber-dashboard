import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
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
import Landing from "./pages/Landing";
import Clientes from "./pages/Clientes";
import Perfil from "./pages/Perfil";
import ClientePerfil from "./pages/ClientePerfil";
import Assinatura from "./pages/Assinatura";
import AdminUsuarios from "./pages/AdminUsuarios";

const queryClient = new QueryClient();

const ClienteProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated } = useClientAuth();
  if (!isAuthenticated) {
    return <Navigate to="/cliente/login" replace />;
  }
  return children;
};

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const ProviderRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (user?.role !== "provider") {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const SuperAdminRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  console.log(user)
  if (user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
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
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/registro" element={<Registro />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/agenda"
                  element={
                    <ProtectedRoute>
                      <Agenda />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/novo-agendamento"
                  element={
                    <ProtectedRoute>
                      <NovoAgendamento />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/configuracoes"
                  element={
                    <ProtectedRoute>
                      <Configuracoes />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/perfil"
                  element={
                    <ProtectedRoute>
                      <Perfil />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/clientes"
                  element={
                    <ProtectedRoute>
                      <Clientes />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/assinatura"
                  element={
                    <ProviderRoute>
                      <Assinatura />
                    </ProviderRoute>
                  }
                />
                <Route
                  path="/admin/usuarios"
                  element={
                    <SuperAdminRoute>
                      <AdminUsuarios />
                    </SuperAdminRoute>
                  }
                />
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
                <Route
                  path="/cliente/perfil"
                  element={
                    <ClienteProtectedRoute>
                      <ClientePerfil />
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
