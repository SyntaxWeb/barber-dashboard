import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Mail, Lock, LogIn } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useClientAuth } from "@/contexts/ClientAuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import defaultLogo from "@/assets/syntax-logo.svg";
import { GoogleClientButton } from "@/components/auth/GoogleClientButton";

export default function ClienteLogin() {
  const { toast } = useToast();
  const { login, loginWithGoogle, companySlug, setCompanySlug, companyInfo } = useClientAuth();
  const { palettes } = useTheme();
  const clientTheme = palettes.client;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const companyFromUrl = searchParams.get("company");
  const targetCompany = companyFromUrl ?? companySlug;
  const companyQuery = targetCompany ? `?company=${targetCompany}` : "";

  useEffect(() => {
    if (companyFromUrl && companyFromUrl !== companySlug) {
      setCompanySlug(companyFromUrl);
    }
  }, [companyFromUrl, companySlug, setCompanySlug]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email || !password) {
      toast({
        title: "Informe seus dados",
        description: "Email e senha são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (!targetCompany) {
      toast({
        title: "Link inválido",
        description: "Acesse pelo link exclusivo da empresa para continuar.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const success = await login(email, password, targetCompany);
    setLoading(false);

    if (!success) {
      toast({
        title: "Não foi possível acessar",
        description: "Verifique as credenciais e tente novamente.",
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Bem-vindo de volta!" });
    navigate(`/cliente${companyQuery}`);
  };

  const handleGoogleCredential = async (credential: string) => {
    if (!targetCompany) {
      toast({
        title: "Link inválido",
        description: "Acesse pelo link exclusivo da empresa para continuar.",
        variant: "destructive",
      });
      return;
    }

    setGoogleLoading(true);
    const success = await loginWithGoogle(credential, targetCompany);
    setGoogleLoading(false);

    if (!success) {
      toast({
        title: "Não foi possível autenticar",
        description: "O Google não confirmou seu acesso. Tente novamente.",
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Login realizado com Google" });
    navigate(`/cliente${companyQuery}`);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: `linear-gradient(180deg, ${clientTheme.background} 0%, ${clientTheme.surface} 70%, #ffffff 100%)` }}
    >
      <Card className="w-full max-w-md border-border shadow-gold">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white border border-border overflow-hidden">
            <img src={companyInfo?.icon_url ?? defaultLogo} alt="SyntaxAtendimento" className="h-full w-full object-cover" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Entrar como cliente</CardTitle>
            <CardDescription>Acompanhe e crie seus agendamentos no SyntaxAtendimento</CardDescription>
            {targetCompany && (
              <p className="mt-2 text-sm text-muted-foreground">
                Você está acessando a agenda da empresa{" "}
                <span className="font-semibold text-foreground">{companyInfo?.nome ?? targetCompany}</span>.
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email-cliente">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email-cliente"
                  placeholder="voce@email.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha-cliente">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="senha-cliente"
                  placeholder="••••••••"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Button type="submit" className="w-full shadow-gold" disabled={loading}>
              {loading ? (
                "Entrando..."
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Entrar
                </span>
              )}
            </Button>
          </form>

          <div className="my-6">
            <Separator className="my-4" />
            <p className="mb-3 text-center text-sm text-muted-foreground">ou continue com o Google</p>
            <GoogleClientButton onCredential={handleGoogleCredential} context="signin" />
            {googleLoading && (
              <p className="mt-2 text-center text-xs text-muted-foreground">Conectando com Google...</p>
            )}
          </div>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Ainda não tem conta?{" "}
            <Link
              to={`/cliente/registro${companyQuery}`}
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              Criar cadastro
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
