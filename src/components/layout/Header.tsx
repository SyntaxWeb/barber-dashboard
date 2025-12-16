import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useSidebar } from "@/components/ui/sidebar";
import defaultLogo from "@/assets/syntax-logo.svg";
import { Menu, Moon, Sun, LogOut, UserRound, CreditCard } from "lucide-react";

export function Header() {
  const { mode, toggleMode } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toggleSidebar } = useSidebar();

  const subscriptionStatus = user?.company?.subscription_status?.toLowerCase() ?? "pendente";
  const subscriptionPlan = formatPlanLabel(user?.company?.subscription_plan);
  const renewLabel = formatRenewalDate(user?.company?.subscription_renews_at);
  const alerts = buildSubscriptionAlerts(subscriptionStatus, user?.company?.subscription_renews_at);
  const statusVariant = subscriptionStatus === "ativo" ? "secondary" : subscriptionStatus === "pendente" ? "destructive" : "outline";
  const statusLabel = statusText(subscriptionStatus);

  const companyName = user?.company?.nome ?? "SyntaxAtendimento";
  const companyIcon = user?.company?.icon_url ?? defaultLogo;
  const initials = (user?.nome ?? "SA")
    .split(" ")
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const goTo = (path: string) => {
    navigate(path);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-16 items-center gap-3 px-4">
        <div className="relative flex flex-1 items-center justify-center md:flex-none md:justify-start">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="absolute left-0 h-11 w-11 rounded-full border border-border/60 bg-muted/60 text-muted-foreground hover:bg-muted md:static md:mr-3 md:h-10 md:w-10 md:bg-transparent"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Abrir menu</span>
          </Button>
          <Link
            to="/dashboard"
            className="flex items-center gap-3 rounded-full px-4 py-1 transition hover:bg-muted/80 md:px-0 md:py-0"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm dark:bg-muted">
              <img src={companyIcon} className="h-8 w-8 object-contain rounded-full" />
            </div>
            <div className="hidden text-left md:block">
              <p className="text-sm font-semibold leading-tight">{companyName}</p>
              <span className="text-xs text-muted-foreground">SyntaxAtendimento</span>
            </div>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-end gap-2">
          <div className="flex flex-col items-end text-right text-xs md:hidden">
            <Badge variant={statusVariant} className="mb-0.5">
              {statusLabel}
            </Badge>
            {renewLabel && <span className="text-[10px] text-muted-foreground">Renova em {renewLabel}</span>}
          </div>

          <div className="hidden md:flex flex-col items-end gap-1 text-right">
            <div className="flex items-center gap-3 rounded-full border border-border/60 bg-muted/40 px-3 py-1">
              <Badge variant={statusVariant}>{statusLabel}</Badge>
              <div className="flex flex-col text-xs leading-tight text-muted-foreground">
                <span className="font-medium text-foreground">{subscriptionPlan}</span>
                {renewLabel && <span className="text-[11px]">Renova em {renewLabel}</span>}
              </div>
            </div>
          </div>

          {alerts.length > 0 ? (
            <div className="hidden items-center gap-2 lg:flex">
              {alerts.map((alert) => (
                <Badge key={alert.label} variant={alert.variant} className="rounded-full px-3 py-1 text-xs font-semibold">
                  {alert.label}
                </Badge>
              ))}
            </div>
          ) : (
            <div className="hidden lg:block text-xs text-muted-foreground">Sem alertas</div>
          )}

          <NotificationBell />

          <Button variant="ghost" size="icon" onClick={toggleMode} className="hidden h-9 w-9 sm:inline-flex">
            {mode === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span className="sr-only">Alternar tema</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="flex items-center gap-3 rounded-full border border-border/70 px-2 py-1 pl-1 pr-3">
                <Avatar className="h-9 w-9 border border-border/70">
                  <AvatarImage src={user?.avatar_url ?? undefined} alt={user?.nome} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="hidden min-w-[140px] flex-col text-left sm:flex">
                  <span className="text-sm font-medium leading-tight">{user?.nome ?? "Prestador"}</span>
                  <span className="text-xs text-muted-foreground">{user?.email ?? "sem e-mail"}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>
                <p className="text-sm font-semibold">{user?.nome}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => goTo("/perfil")}>
                <UserRound className="mr-2 h-4 w-4" />
                Meu perfil
              </DropdownMenuItem>
              {user?.role === "provider" && (
                <DropdownMenuItem onSelect={() => goTo("/assinatura")}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Minha assinatura
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

function formatPlanLabel(plan?: string | null) {
  if (!plan) {
    return "Plano Syntax";
  }
  const normalized = plan
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  return `Plano ${normalized}`;
}

function formatRenewalDate(date?: string | null) {
  if (!date) return null;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(parsed);
}

function statusText(status: string) {
  switch (status) {
    case "ativo":
      return "Plano ativo";
    case "pendente":
      return "Pagamento pendente";
    case "cancelado":
      return "Assinatura cancelada";
    default:
      return "Status indefinido";
  }
}

function buildSubscriptionAlerts(status: string, renewDate?: string | null) {
  const alerts: { label: string; variant: "secondary" | "destructive" | "outline" }[] = [];

  if (status === "pendente") {
    alerts.push({ label: "Pagamento pendente", variant: "destructive" });
  }

  if (status === "cancelado") {
    alerts.push({ label: "Assinatura cancelada", variant: "outline" });
  }

  if (renewDate) {
    const parsed = new Date(renewDate);
    const diffDays = (parsed.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (!Number.isNaN(diffDays) && diffDays <= 7 && diffDays >= 0) {
      alerts.push({ label: "Renovação próxima", variant: "secondary" });
    }
  }

  return alerts;
}
