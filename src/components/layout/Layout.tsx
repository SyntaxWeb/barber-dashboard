import { ReactNode, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { Location } from "react-router-dom";
import { Header } from "./Header";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CalendarCheck2,
  CalendarDays,
  ChevronsLeft,
  ChevronsRight,
  CreditCard,
  FileText,
  LayoutDashboard,
  type LucideIcon,
  Scissors,
  Settings,
  Shield,
  UserRound,
  Users2,
  BarChart3,
} from "lucide-react";
import defaultLogo from "@/assets/syntax-logo.svg";

interface LayoutProps {
  children: ReactNode;
}

type DashboardNavItem = {
  key: string;
  label: string;
  to: string;
  icon: LucideIcon;
  hash?: string;
  roles?: string[];
  match?: (location: Location) => boolean;
};

type AuthUser = ReturnType<typeof useAuth>["user"];

const mainNavigation: DashboardNavItem[] = [
  {
    key: "dashboard",
    label: "Início / Dashboard",
    to: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    key: "agenda",
    label: "Agenda",
    to: "/agenda",
    icon: CalendarDays,
  },
  {
    key: "agendamentos",
    label: "Agendamentos",
    to: "/novo-agendamento",
    icon: CalendarCheck2,
  },
  {
    key: "clientes",
    label: "Clientes",
    to: "/clientes",
    icon: Users2,
  },
  {
    key: "relatorios",
    label: "Relatórios",
    to: "/relatorios",
    icon: BarChart3,
    roles: ["provider"],
  },
  {
    key: "servicos",
    label: "Serviços",
    to: "/configuracoes",
    hash: "#servicos",
    icon: Scissors,
    match: (location) => location.pathname === "/configuracoes" && location.hash === "#servicos",
  },
  {
    key: "assinatura",
    label: "Minha Assinatura",
    to: "/assinatura",
    icon: CreditCard,
    roles: ["provider"],
  },
  {
    key: "configuracoes",
    label: "Configurações",
    to: "/configuracoes",
    icon: Settings,
    match: (location) => location.pathname === "/configuracoes" && location.hash !== "#servicos",
  },
];

const adminNavigation: DashboardNavItem[] = [
  {
    key: "admin-users",
    label: "Usuários",
    to: "/admin/usuarios",
    icon: Shield,
    roles: ["admin"],
  },
  {
    key: "admin-logs",
    label: "Logs e auditoria",
    to: "/admin/logs",
    icon: FileText,
    roles: ["admin"],
  },
];

export function Layout({ children }: LayoutProps) {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { activatePalette } = useTheme();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      activatePalette("dashboard");
    }
  }, [isAuthenticated, activatePalette]);

  if (!isAuthenticated) {
    return null;
  }

  const allowedSubscriptionPaths = ["/assinatura", "/assinatura/sucesso", "/assinatura/pendente", "/assinatura/erro"];
  const subscriptionStatus = user?.company?.subscription_status?.toLowerCase() ?? "pendente";
  const isProvider = user?.role === "provider";
  const mustBlockPanel = isProvider && subscriptionStatus !== "ativo" && !allowedSubscriptionPaths.includes(location.pathname);

  return (
    <SidebarProvider>
      <div className="w-full flex min-h-screen bg-background text-foreground">
        <AppSidebar user={user} />
        <SidebarInset>
          <Header />
          <div className="flex-1 px-4 pb-8 pt-6 md:px-8 md:pt-8">
            {mustBlockPanel ? (
              <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 rounded-2xl border border-dashed border-amber-400/40 bg-amber-50/20 p-10 text-center dark:bg-amber-500/5">
                <h2 className="text-2xl font-semibold text-foreground">Assinatura pendente</h2>
                <p className="max-w-xl text-muted-foreground">
                  Liberamos o acesso completo assim que o pagamento for confirmado. Finalize a assinatura abaixo para continuar
                  controlando sua agenda normalmente.
                </p>
                <Button onClick={() => navigate("/assinatura")} className="shadow-gold">
                  Ir para assinatura
                </Button>
              </div>
            ) : (
              children
            )}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function AppSidebar({ user }: { user: AuthUser }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, toggleSidebar, isMobile, setOpenMobile } = useSidebar();
  const role = user?.role ?? "provider";

  const companyName = user?.company?.nome ?? "SyntaxAtendimento";
  const companyIcon = user?.company?.icon_url ?? defaultLogo;

  const isAllowed = (item: DashboardNavItem) => {
    if (!item.roles || item.roles.length === 0) return true;
    return item.roles.includes(role);
  };

  const filteredMain = mainNavigation.filter(isAllowed);
  const filteredAdmin = adminNavigation.filter(isAllowed);

  const handleItemClick = (item: DashboardNavItem) => {
    const destination = item.hash ? `${item.to}${item.hash}` : item.to;
    navigate(destination);
    if (item.hash) {
      setTimeout(() => {
        const target = document.querySelector(item.hash ?? "");
        target?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
    }
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const initials = (user?.nome ?? "SA")
    .split(" ")
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const isActive = (item: DashboardNavItem) => {
    if (item.match) {
      return item.match(location);
    }
    return location.pathname === item.to;
  };

  const goToProfile = () => {
    navigate("/perfil");
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar pb-4 text-sidebar-foreground">
      <SidebarHeader className="border-b border-sidebar-border group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:pt-3">
        <Link
          to="/dashboard"
          className="flex items-center gap-3 rounded-xl px-2 py-1 transition hover:bg-sidebar-accent group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:rounded-full group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-0"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-muted">
            <img src={companyIcon} className="h-8 w-8 rounded-full object-cover" />
          </div>
          <div className="space-y-0.5 group-data-[collapsible=icon]:hidden">
            <p className="text-sm font-semibold leading-tight">{companyName}</p>
            <span className="text-xs text-sidebar-foreground/70">SyntaxAtendimento</span>
          </div>
        </Link>
        {/* <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="m-auto hidden h-8 w-8 rounded-full md:inline-flex"
        >
          {state === "expanded" ? <ChevronsLeft className="h-4 w-4" /> : <ChevronsRight className="h-4 w-4" />}
          <span className="sr-only">Alternar largura da Sidebar</span>
        </Button> */}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMain.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      tooltip={item.label}
                      isActive={isActive(item)}
                      onClick={() => handleItemClick(item)}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {filteredAdmin.length > 0 && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Administração</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {filteredAdmin.map((item) => {
                    const Icon = item.icon;
                    return (
                      <SidebarMenuItem key={item.key}>
                        <SidebarMenuButton
                          tooltip={item.label}
                          isActive={isActive(item)}
                          onClick={() => handleItemClick(item)}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="px-4 group-data-[collapsible=icon]:px-2">
        <div className="rounded-2xl border border-sidebar-border/70 bg-sidebar-accent/40 p-3 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:border-none group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0">
          <div className="flex items-center gap-3 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-2">
            <Avatar className="h-10 w-10 border border-sidebar-border/60 bg-background">
              <AvatarImage src={user?.avatar_url ?? undefined} alt={user?.nome} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 text-sm group-data-[collapsible=icon]:hidden">
              <p className="truncate font-semibold">{user?.nome ?? "Prestador"}</p>
              <p className="truncate text-xs text-sidebar-foreground/70">{user?.email ?? "sem e-mail"}</p>
            </div>
          </div>
          <Button
            variant="secondary"
            className="mt-3 w-full group-data-[collapsible=icon]:mt-2 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:rounded-full group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:shadow-none"
            onClick={goToProfile}
          >
            <UserRound className="mr-2 h-4 w-4 group-data-[collapsible=icon]:mr-0" />
            <span className="ml-2 group-data-[collapsible=icon]:ml-0 group-data-[collapsible=icon]:sr-only">
              Acessar perfil
            </span>
          </Button>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
