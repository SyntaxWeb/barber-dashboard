import { ReactNode, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useClientAuth } from "@/contexts/ClientAuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  CalendarCheck,
  NotebookPen,
  UserRound,
  LogOut,
  Menu,
  Sparkles,
  Home,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import defaultLogo from "@/assets/syntax-logo.svg";
interface ClientPortalLayoutProps {
  children: ReactNode;
}

const navItems = [
  {
    key: "inicio",
    label: "Início",
    description: "Visão geral da barbearia",
    to: "/cliente",
    icon: Home,
  },
  {
    key: "agendar",
    label: "Novo agendamento",
    description: "Escolha serviço e horário",
    to: "/cliente/agendar",
    icon: NotebookPen,
  },
  {
    key: "agendamentos",
    label: "Meus agendamentos",
    description: "Acompanhe e remaneje",
    to: "/cliente/agendamentos",
    icon: CalendarCheck,
  },
  {
    key: "perfil",
    label: "Perfil",
    description: "Atualize seus dados",
    to: "/cliente/perfil",
    icon: UserRound,
  },
];

export function ClientPortalLayout({ children }: ClientPortalLayoutProps) {
  const { client, companyInfo, logout } = useClientAuth();

  console.log(client)

  const { palettes } = useTheme();
  const clientTheme = palettes.client;
  const location = useLocation();
  const navigate = useNavigate();
    const companyIcon = companyInfo?.icon_url ?? defaultLogo;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const companyName = companyInfo?.nome ?? "Cliente Syntax";
  const initials = useMemo(() => {
    if (client?.name) {
      return client.name
        .split(" ")
        .slice(0, 2)
        .map((word) => word.charAt(0))
        .join("")
        .toUpperCase();
    }
    return "CL";
  }, [client?.name]);

  const renderNav = (variant: "desktop" | "mobile") =>
    navItems.map((item) => {
      const active = location.pathname === item.to;
      return (
        <button
          key={item.key}
          onClick={() => {
            navigate(item.to);
            if (variant === "mobile") {
              setMobileMenuOpen(false);
            }
          }}
          className={cn(
            "w-full rounded-xl border p-3 text-left transition-all",
            active
              ? "border-primary/50 bg-white/60 text-primary"
              : "border-transparent hover:border-border hover:bg-muted/60",
          )}
        >
          <div className="flex items-center gap-3">
            <item.icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
            <div>
              <p className="text-sm font-semibold">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
          </div>
        </button>
      );
    });

  return (
    <div
      className="min-h-screen"
      style={{
        background: `linear-gradient(180deg, ${clientTheme.background} 0%, ${clientTheme.surface} 65%, #f6f6f6 100%)`,
      }}
    >
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <header className="sticky top-0 z-30 border-b border-border/60 bg-white/90 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 md:px-8">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
              <Link
                to="/cliente"
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
            <div className="flex items-center gap-3">
              <div className="hidden text-right text-sm md:block">
                <p className="font-semibold">{client?.name ?? "Cliente"}</p>
                <p className="text-xs text-muted-foreground">Bem-vindo(a)</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                <Avatar className="h-9 w-9 border border-border/70">
                  <AvatarImage src={client?.avatar_url ?? undefined} alt={client?.name} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>              </div>
              <Button variant="ghost" size="icon" onClick={logout} aria-label="Sair">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        <SheetContent side="left" className="w-80 bg-white p-0">
          <div className="h-full overflow-y-auto p-4">
            <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/40 p-3">
              <Sparkles className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">{companyName}</p>
                <p className="text-xs text-muted-foreground">Escolha o que deseja fazer</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">{renderNav("mobile")}</div>
            <Button variant="outline" className="mt-6 w-full" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Encerrar sessão
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <div className="mx-auto flex w-full max-w-6xl gap-4 px-4 pb-10 pt-6 md:gap-6 md:px-8">
        <aside className="sticky top-24 hidden w-64 flex-shrink-0 flex-col gap-4 md:flex">
          <div className="rounded-2xl border border-border/60 bg-white/90 p-4 shadow-sm">
            <p className="text-sm font-semibold text-foreground">{companyName}</p>
            <p className="text-xs text-muted-foreground">Escolha uma opção:</p>
          </div>
          <nav className="space-y-3">{renderNav("desktop")}</nav>
        </aside>
        <main className="flex-1">
          <div className="rounded-[32px] p-4 sm:p-6 lg:p-8">{children}</div>

        </main>
      </div>
    </div>
  );
}
