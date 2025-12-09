import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-4">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-black/40 p-10 text-center shadow-2xl shadow-primary/30 backdrop-blur">
        <p className="text-sm uppercase tracking-[0.5em] text-primary/70">erro</p>
        <h1 className="mb-4 text-7xl font-black text-white">404</h1>
        <p className="mb-10 text-lg text-slate-200">
          A rota <span className="font-mono text-primary">{location.pathname}</span> não existe ou foi movida.
        </p>
        <Button size="lg" onClick={() => navigate(isAuthenticated ? "/dashboard" : "/login")} className="shadow-gold">
          Voltar para o painel
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
