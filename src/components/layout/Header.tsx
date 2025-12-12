import { Link, useNavigate } from "react-router-dom";
import { Moon, Sun, Settings, LogOut, Scissors, UserRound, CreditCard, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationBell } from "@/components/notifications/NotificationBell";

export function Header() {
  const { mode, toggleMode } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isProvider = user?.role === "provider";
  const isAdmin = user?.role === "admin";

  const companyName = user?.company?.nome ?? (isAdmin ? "Painel Superadmin" : "SyntaxAtendimento");
  const companyIcon = user?.company?.icon_url;
  const tagline = isAdmin ? "Painel Superadmin" : "Painel SyntaxAtendimento";
  const avatar = user?.avatar_url;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary overflow-hidden">
            {companyIcon ? (
              <img src={companyIcon} alt={companyName} className="h-full w-full object-cover" />
            ) : (
              <Scissors className="h-5 w-5 text-primary-foreground" />
            )}
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold tracking-tight">{companyName}</h1>
            <p className="text-xs text-muted-foreground">{tagline}</p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {user && (
            <span className="hidden md:flex items-center text-sm text-muted-foreground mr-2 gap-2">
              {avatar ? (
                <img src={avatar} alt={user.nome} className="h-8 w-8 rounded-full object-cover border border-border" />
              ) : null}
              <span>
                Olá, <span className="text-foreground font-medium">{user.nome}</span>
              </span>
            </span>
          )}

          <NotificationBell />

          <Button variant="ghost" size="icon" onClick={toggleMode} className="h-9 w-9">
            {mode === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span className="sr-only">Alternar tema</span>
          </Button>

          {isProvider && (
            <Button variant="ghost" size="icon" asChild className="h-9 w-9">
              <Link to="/assinatura">
                <CreditCard className="h-4 w-4" />
                <span className="sr-only">Assinatura</span>
              </Link>
            </Button>
          )}

          {isAdmin && (
            <Button variant="ghost" size="icon" asChild className="h-9 w-9">
              <Link to="/admin/usuarios">
                <Shield className="h-4 w-4" />
                <span className="sr-only">Superadmin</span>
              </Link>
            </Button>
          )}

          <Button variant="ghost" size="icon" asChild className="h-9 w-9">
            <Link to="/perfil">
              <UserRound className="h-4 w-4" />
              <span className="sr-only">Perfil</span>
            </Link>
          </Button>

          <Button variant="ghost" size="icon" asChild className="h-9 w-9">
            <Link to="/configuracoes">
              <Settings className="h-4 w-4" />
              <span className="sr-only">Configurações</span>
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Sair</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
