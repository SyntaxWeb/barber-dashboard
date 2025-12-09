import { Link, useNavigate } from "react-router-dom";
import { Moon, Sun, Settings, LogOut, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const companyName = user?.company?.nome ?? "SyntaxAtendimento";
  const companyIcon = user?.company?.icon_url;
  console.log(companyIcon)

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
            <p className="text-xs text-muted-foreground">Painel SyntaxAtendimento</p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {user && (
            <span className="hidden md:block text-sm text-muted-foreground mr-2">
              Olá, <span className="text-foreground font-medium">{user.nome}</span>
            </span>
          )}

          <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span className="sr-only">Alternar tema</span>
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
