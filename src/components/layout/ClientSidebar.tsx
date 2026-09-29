import { Building2, CalendarCheck, History, Home, LogOut, NotebookPen, Search, UserRound } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useClientAuth } from "@/contexts/ClientAuthContext";
import { cn } from "@/lib/utils";
import defaultLogo from "@/assets/syntax-logo.svg";

export const clientNavItems = [
  { key: "explorar", label: "Explorar", description: "Descubra novos lugares", to: "/explorar", icon: Search },
  { key: "inicio", label: "Inicio", description: "Visao geral da sua conta", to: "/cliente", icon: Home },
  { key: "barbearias", label: "Favoritas", description: "Lugares onde voce ja foi", to: "/cliente/barbearias", icon: Building2 },
  { key: "agendar", label: "Novo agendamento", description: "Escolha servico e horario", to: "/cliente/agendar", icon: NotebookPen },
  { key: "agendamentos", label: "Meus agendamentos", description: "Acompanhe e remaneje", to: "/cliente/agendamentos", icon: CalendarCheck },
  { key: "historico", label: "Historico", description: "Atendimentos realizados", to: "/cliente/agendamentos?tab=historico", icon: History },
  { key: "perfil", label: "Meus dados", description: "Atualize seu perfil", to: "/cliente/perfil", icon: UserRound },
];

type ClientSidebarProps = {
  mobile?: boolean;
  onNavigate?: () => void;
};

export function ClientSidebarContent({ mobile = false, onNavigate }: ClientSidebarProps) {
  const { client, logout } = useClientAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const go = (to: string) => {
    navigate(to);
    onNavigate?.();
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-sidebar text-sidebar-foreground">
      <button onClick={() => go("/cliente")} className="flex items-center gap-3 border-b border-primary/15 bg-black/10 px-5 py-5 text-left hover:bg-primary/10">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-card">
          <img src={defaultLogo} alt="SyntaxAtendimento" className="h-8 w-8 object-contain" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-sidebar-foreground">{client?.name ?? "Cliente Syntax"}</span>
          <span className="block text-xs text-sidebar-foreground/70">SyntaxAtendimento</span>
        </span>
      </button>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        <p className="px-3 pb-2 text-xs font-semibold uppercase text-primary/80">Menu do cliente</p>
        <nav className="space-y-1">
          {clientNavItems.map((item) => {
            const active = item.to.includes("?")
              ? `${location.pathname}${location.search}` === item.to
              : location.pathname === item.to && !(item.to === "/cliente/agendamentos" && location.search);
            const Icon = item.icon;
            return (
              <button key={item.key} onClick={() => go(item.to)} className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors", active ? "bg-primary text-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}>
                <Icon className="h-4 w-4 shrink-0" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{item.label}</span>
                  <span className={cn("block text-xs", active ? "text-primary-foreground/80" : "text-sidebar-foreground/65")}>{item.description}</span>
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-primary/15 p-3">
        <button onClick={() => { logout(); onNavigate?.(); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent">
          <LogOut className="h-4 w-4" />Sair
        </button>
      </div>
    </div>
  );
}

export function ClientSidebar() {
  return <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-primary/20 bg-sidebar shadow-[18px_0_60px_rgba(0,0,0,0.24)] lg:block"><ClientSidebarContent /></aside>;
}
