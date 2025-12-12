import { ReactNode, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Header } from "./Header";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: ReactNode;
}

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
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container px-4 py-6">
        {mustBlockPanel ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center text-center space-y-4 border border-dashed border-amber-400/40 rounded-2xl bg-amber-50/20 p-10">
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
      </main>
    </div>
  );
}
