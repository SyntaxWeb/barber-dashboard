import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, KeyRound, Lock } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { resetPassword } from "@/services/passwordResetService";

export default function RedefinirSenha() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);
  const emailFromUrl = useMemo(() => searchParams.get("email") ?? "", [searchParams]);
  const [email, setEmail] = useState(emailFromUrl);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!token) {
      toast({
        title: "Link inválido",
        description: "Solicite um novo link de redefinição.",
        variant: "destructive",
      });
      return;
    }

    if (!email.trim() || !password || !passwordConfirmation) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha email, nova senha e confirmação.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Senha muito curta",
        description: "Use pelo menos 8 caracteres.",
        variant: "destructive",
      });
      return;
    }

    if (password !== passwordConfirmation) {
      toast({
        title: "Senhas diferentes",
        description: "A confirmação precisa ser igual à nova senha.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await resetPassword({
        email: email.trim(),
        token,
        password,
        password_confirmation: passwordConfirmation,
      });
      toast({
        title: "Senha redefinida",
        description: "Entre novamente usando sua nova senha.",
      });
      navigate("/login", { replace: true });
    } catch (error) {
      toast({
        title: "Não foi possível redefinir",
        description: error instanceof Error ? error.message : "Solicite um novo link e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Nova senha" description="Crie uma senha segura para voltar ao painel">
      {!token ? (
        <div className="rounded-lg border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-50">
          Este link não possui token de redefinição.
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-[#e6d3ad]">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-12 border-white/15 bg-[#111417]/85 text-base text-white placeholder:text-zinc-500 focus-visible:ring-[#d49a62]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-[#e6d3ad]">
            Nova senha
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#b8825b]" />
            <Input
              id="password"
              type="password"
              placeholder="mínimo 8 caracteres"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-12 border-white/15 bg-[#111417]/85 pl-11 text-base text-white placeholder:text-zinc-500 focus-visible:ring-[#d49a62]"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password_confirmation" className="text-[#e6d3ad]">
            Confirmar senha
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#b8825b]" />
            <Input
              id="password_confirmation"
              type="password"
              placeholder="repita a nova senha"
              value={passwordConfirmation}
              onChange={(event) => setPasswordConfirmation(event.target.value)}
              className="h-12 border-white/15 bg-[#111417]/85 pl-11 text-base text-white placeholder:text-zinc-500 focus-visible:ring-[#d49a62]"
            />
          </div>
        </div>

        <Button
          type="submit"
          className="h-12 w-full border border-[#c48b5f]/60 bg-gradient-to-r from-[#7b3516] via-[#b37338] to-[#703010] text-base text-white shadow-[0_16px_40px_rgba(128,62,25,0.35)] hover:from-[#8c421d] hover:via-[#c18445] hover:to-[#803817]"
          disabled={loading || !token}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Salvando...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <KeyRound className="h-4 w-4" />
              Redefinir senha
            </span>
          )}
        </Button>
      </form>

      <button
        type="button"
        onClick={() => navigate("/login")}
        className="mt-5 flex w-full items-center justify-center gap-2 text-sm font-semibold text-[#e6c895] underline-offset-4 hover:underline hover:text-[#f3d9a8]"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para login
      </button>
    </AuthShell>
  );
}
