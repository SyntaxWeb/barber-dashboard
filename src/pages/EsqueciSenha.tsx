import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Send } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { requestPasswordReset } from "@/services/passwordResetService";

export default function EsqueciSenha() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email.trim()) {
      toast({
        title: "Informe seu email",
        description: "Precisamos do email cadastrado para enviar o link.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await requestPasswordReset(email.trim());
      setSent(true);
      toast({
        title: "Verifique seu email",
        description: response.message,
      });
    } catch (error) {
      toast({
        title: "Não foi possível enviar",
        description: error instanceof Error ? error.message : "Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Recuperar acesso" description="Enviaremos um link seguro para redefinir sua senha">
      {sent ? (
        <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-50">
          Se o email estiver cadastrado, o link de redefinição chegará em poucos minutos.
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
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
              onChange={(event) => setEmail(event.target.value)}
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
              Enviando...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Enviar link
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
