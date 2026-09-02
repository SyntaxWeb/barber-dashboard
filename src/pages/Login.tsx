import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { AuthShell } from "@/components/auth/AuthShell";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === "admin") {
        navigate("/admin/usuarios", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [isAuthenticated, user?.role, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !senha) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const success = await login(email, senha);
      if (success) {
        toast({
          title: "Bem-vindo!",
          description: "Login realizado com sucesso.",
        });
      } else {
        toast({
          title: "Erro no login",
          description: "Email ou senha inválidos.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="SyntaxAtendimento" description="Entre no painel para profissionais e negocios de servicos">
      <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#e6d3ad]">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#b8825b]" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 border-white/15 bg-[#111417]/85 pl-11 text-base text-white placeholder:text-zinc-500 focus-visible:ring-[#d49a62]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha" className="text-[#e6d3ad]">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#b8825b]" />
                <Input
                  id="senha"
                  type="password"
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="h-12 border-white/15 bg-[#111417]/85 pl-11 text-base text-white placeholder:text-zinc-500 focus-visible:ring-[#d49a62]"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="h-12 w-full border border-[#c48b5f]/60 bg-gradient-to-r from-[#7b3516] via-[#b37338] to-[#703010] text-base text-white shadow-[0_16px_40px_rgba(128,62,25,0.35)] hover:from-[#8c421d] hover:via-[#c18445] hover:to-[#803817]"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Entrando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Entrar
                </span>
              )}
            </Button>
      </form>

      <button
        type="button"
        onClick={() => navigate("/esqueci-senha")}
        className="mt-4 block w-full text-center text-sm font-semibold text-[#e6c895] underline-offset-4 hover:underline hover:text-[#f3d9a8]"
      >
        Esqueci minha senha
      </button>

      <p className="mt-8 text-center text-sm text-zinc-100">Use qualquer email valido e senha para entrar</p>
      <p className="mt-4 text-center text-sm text-zinc-100">
        Ainda nao tem acesso?{" "}
        <button
          type="button"
          onClick={() => navigate("/registro")}
          className="font-semibold text-[#e6c895] underline underline-offset-4 hover:text-[#f3d9a8]"
        >
          Crie sua conta gratuita
        </button>
      </p>
    </AuthShell>
  );
}
