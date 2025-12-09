import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Sparkles, Mail, User, Phone, Lock, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useClientAuth } from "@/contexts/ClientAuthContext";

export default function ClienteRegistro() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, companySlug, setCompanySlug } = useClientAuth();
  const companyFromUrl = searchParams.get("company");
  const prefillName = searchParams.get("nome");
  const prefillEmail = searchParams.get("email");
  const prefillPhone = searchParams.get("telefone");
  const targetCompany = companyFromUrl ?? companySlug;
  const companyQuery = targetCompany ? `?company=${targetCompany}` : "";

  useEffect(() => {
    if (companyFromUrl && companyFromUrl !== companySlug) {
      setCompanySlug(companyFromUrl);
    }
  }, [companyFromUrl, companySlug, setCompanySlug]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (prefillName) {
      setName(prefillName);
    }
  }, [prefillName]);

  useEffect(() => {
    if (prefillEmail) {
      setEmail(prefillEmail);
    }
  }, [prefillEmail]);

  useEffect(() => {
    if (prefillPhone) {
      setTelefone(prefillPhone);
    }
  }, [prefillPhone]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!name || !email || !telefone || !password || !confirmPassword) {
      toast({
        title: "Complete o formulário",
        description: "Todos os campos são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Senhas diferentes",
        description: "Digite a mesma senha nos dois campos.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const success = await register({
      name,
      email,
      telefone,
      password,
      password_confirmation: confirmPassword,
    });
    setLoading(false);

    if (!success) {
      toast({
        title: "Erro ao criar sua conta",
        description: "Verifique os dados e tente novamente.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Bem-vindo!",
      description: "Agora você pode agendar seus serviços.",
    });
    navigate(`/cliente/agendar${companyQuery}`);
  };

  return (
    <div className="min-h-screen bg-muted/50 flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-lg border-border shadow-gold">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Criar conta no SyntaxAtendimento</CardTitle>
            <CardDescription>Agende serviços com seus profissionais favoritos</CardDescription>
            {targetCompany && (
              <p className="mt-2 text-sm text-muted-foreground">
                Conectado ao link da empresa{" "}
                <span className="font-semibold text-foreground">{targetCompany}</span>.
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="nome">Nome completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="nome"
                  placeholder="Camila Andrade"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="voce@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">WhatsApp</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="telefone"
                  placeholder="(11) 99999-0000"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="senha"
                  type="password"
                  placeholder="Crie uma senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmar">Confirmar senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmar"
                  type="password"
                  placeholder="Repita a senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Button type="submit" className="w-full shadow-gold" disabled={loading}>
              {loading ? (
                "Criando conta..."
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Começar agora
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link
              to={`/cliente/login${companyQuery}`}
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              Entrar
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
