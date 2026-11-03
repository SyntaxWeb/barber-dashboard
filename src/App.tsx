import { lazy, Suspense, useLayoutEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ClientAuthProvider, useClientAuth } from "@/contexts/ClientAuthContext";
const Login = lazy(() => import("./pages/Login"));
const EsqueciSenha = lazy(() => import("./pages/EsqueciSenha"));
const RedefinirSenha = lazy(() => import("./pages/RedefinirSenha"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Agenda = lazy(() => import("./pages/Agenda"));
const NovoAgendamento = lazy(() => import("./pages/NovoAgendamento"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Registro = lazy(() => import("./pages/Registro"));
const ClienteRegistro = lazy(() => import("./pages/ClienteRegistro"));
const ClienteLogin = lazy(() => import("./pages/ClienteLogin"));
const ClienteAgendamento = lazy(() => import("./pages/ClienteAgendamento"));
const ClienteAgendamentos = lazy(() => import("./pages/ClienteAgendamentos"));
const PublicAgendamento = lazy(() => import("./pages/PublicAgendamento"));
const Landing = lazy(() => import("./pages/Landing"));
const Clientes = lazy(() => import("./pages/Clientes"));
const Perfil = lazy(() => import("./pages/Perfil"));
const ClientePerfil = lazy(() => import("./pages/ClientePerfil"));
const ClienteDashboard = lazy(() => import("./pages/ClienteDashboard"));
const FeedbackPublico = lazy(() => import("./pages/FeedbackPublico"));
const Relatorios = lazy(() => import("./pages/Relatorios"));
const Estoque = lazy(() => import("./pages/Estoque"));
const Caixa = lazy(() => import("./pages/Caixa"));
const Assinatura = lazy(() => import("./pages/Assinatura"));
const AdminUsuarios = lazy(() => import("./pages/AdminUsuarios"));
const AdminLogs = lazy(() => import("./pages/AdminLogs"));
const AssinaturaSucesso = lazy(() => import("./pages/AssinaturaSucesso"));
const AssinaturaPendente = lazy(() => import("./pages/AssinaturaPendente"));
const AssinaturaErro = lazy(() => import("./pages/AssinaturaErro"));
const PoliticaPrivacidade = lazy(() => import("./pages/PoliticaPrivacidade"));
const Explorar = lazy(() => import("./pages/Explorar"));
const ClienteBarbearias = lazy(() => import("./pages/ClienteBarbearias"));

const queryClient = new QueryClient();

const ClienteProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated } = useClientAuth();
  if (!isAuthenticated) {
    return <Navigate to="/cliente/login" replace />;
  }
  return children;
};

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  const isProvider = user?.role === "provider";
  const subscriptionStatus = user?.company?.subscription_status?.toLowerCase() ?? "pendente";
  const allowedPaths = ["/assinatura", "/assinatura/sucesso", "/assinatura/pendente", "/assinatura/erro"];
  if (isProvider && subscriptionStatus !== "ativo" && !allowedPaths.includes(location.pathname)) {
    return <Navigate to="/assinatura" replace />;
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

const ProviderOrAdminRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (user?.role !== "provider" && user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const SuperAdminRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function RoutePalette() {
  const { pathname } = useLocation();
  const { activatePalette } = useTheme();
  const kind = pathname.startsWith("/cliente") || pathname.startsWith("/e/") || pathname === "/explorar" ? "client" : "dashboard";
  useLayoutEffect(() => { activatePalette(kind); }, [activatePalette, kind]);
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <ClientAuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter future={{ v7_startTransition: true }}>
              <Suspense fallback={<div role="status" className="flex min-h-[50vh] items-center justify-center">Carregando página...</div>}>
              <RoutePalette />
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/explorar" element={<Explorar />} />
                <Route path="/login" element={<Login />} />
                <Route path="/esqueci-senha" element={<EsqueciSenha />} />
                <Route path="/redefinir-senha" element={<RedefinirSenha />} />
                <Route path="/registro" element={<Registro />} />
                <Route path="/politica-de-privacidade" element={<PoliticaPrivacidade />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route path="/cliente/feedback" element={<FeedbackPublico />} />
                <Route
                  path="/relatorios"
                  element={
                    <ProviderOrAdminRoute>
                      <Relatorios />
                    </ProviderOrAdminRoute>
                  }
                />
                <Route
                  path="/estoque"
                  element={
                    <ProviderOrAdminRoute>
                      <Estoque />
                    </ProviderOrAdminRoute>
                  }
                />
                <Route
                  path="/caixa"
                  element={
                    <ProviderOrAdminRoute>
                      <Caixa />
                    </ProviderOrAdminRoute>
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
                  path="/assinatura/sucesso"
                  element={
                    <ProviderRoute>
                      <AssinaturaSucesso />
                    </ProviderRoute>
                  }
                />
                <Route
                  path="/assinatura/pendente"
                  element={
                    <ProviderRoute>
                      <AssinaturaPendente />
                    </ProviderRoute>
                  }
                />
                <Route
                  path="/assinatura/erro"
                  element={
                    <ProviderRoute>
                      <AssinaturaErro />
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
                <Route
                  path="/admin/logs"
                  element={
                    <SuperAdminRoute>
                      <AdminLogs />
                    </SuperAdminRoute>
                  }
                />
                <Route path="/cliente/registro" element={<ClienteRegistro />} />
                <Route path="/cliente/login" element={<ClienteLogin />} />
                <Route path="/e/:slug/agendar" element={<PublicAgendamento />} />
                <Route
                  path="/cliente"
                  element={
                    <ClienteProtectedRoute>
                      <ClienteDashboard />
                    </ClienteProtectedRoute>
                  }
                />
                <Route
                  path="/cliente/barbearias"
                  element={
                    <ClienteProtectedRoute>
                      <ClienteBarbearias />
                    </ClienteProtectedRoute>
                  }
                />
                <Route
                  path="/cliente/agendar"
                  element={
                    <ClienteProtectedRoute>
                      <ClienteAgendamento />
                    </ClienteProtectedRoute>
                  }
                />
                <Route
                  path="/cliente/agendamentos"
                  element={
                    <ClienteProtectedRoute>
                      <ClienteAgendamentos />
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
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </ClientAuthProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
