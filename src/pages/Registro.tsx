import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Users, CalendarRange, Send, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import defaultLogo from "@/assets/syntax-logo.svg";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:4002";

const highlights = [
  {
    icon: CalendarRange,
    title: "Agenda inteligente",
    description: "Automatize confirmações e mantenha sua rotina de serviços sempre em dia.",
  },
  {
    icon: Users,
    title: "Equipe organizada",
    description: "Distribua atendimentos, acompanhe performance e reduza ociosidade.",
  },
  {
    icon: CheckCircle2,
    title: "Experiência premium",
    description: "Lembretes elegantes, histórico dos clientes e tudo em tempo real.",
  },
];

export default function Registro() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [telefone, setTelefone] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!nome || !email || !empresa || !telefone || !senha || !confirmarSenha) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome, e-mail, empresa, Telegram e senha para avançar.",
        variant: "destructive",
      });
      return;
    }

    if (senha !== confirmarSenha) {
      toast({
        title: "Senhas diferentes",
        description: "Confirme a mesma senha nos dois campos.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nome,
          email,
          password: senha,
          password_confirmation: confirmarSenha,
          empresa,
          telefone,
          objetivo,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message || "Não foi possível concluir seu cadastro.");
      }

      toast({
        title: "Conta criada com sucesso!",
        description: "Finalize o pagamento da assinatura para liberar o painel.",
      });

      const logged = await login(email, senha);
      if (logged) {
        navigate("/assinatura");
      } else {
        navigate("/login");
      }
    } catch (error) {
      toast({
        title: "Erro ao registrar",
        description: error instanceof Error ? error.message : "Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background/60 py-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 lg:flex-row lg:items-start">
        <section className="flex-1 rounded-3xl border border-border bg-card/70 p-8 shadow-gold">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-primary">
            <img src={defaultLogo} alt="SyntaxAtendimento" className="h-6 w-6 rounded-full border border-border" />
            SyntaxAtendimento
          </div>

          <h1 className="mt-6 text-4xl font-bold leading-tight">
            Crie sua conta gratuita e comece a organizar o atendimento hoje mesmo.
          </h1>

          <p className="mt-4 text-lg text-muted-foreground">
            Cadastre-se em minutos para testar a agenda inteligente, o controle da equipe e todos os recursos premium
            para qualquer profissional que trabalha com serviços personalizados, sem burocracia.
          </p>

          <div className="mt-8 grid gap-6">
            {highlights.map((item) => (
              <div key={item.title} className="flex gap-4 rounded-2xl border border-border/70 bg-background/30 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-base font-semibold">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="w-full max-w-lg">
          <Card className="border-border shadow-gold">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Criar conta gratuita</CardTitle>
                  <CardDescription>
                    Conte sobre seu negócio de serviços e destrave um ambiente exclusivo para a sua empresa.
                  </CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => navigate("/login")} aria-label="Voltar ao login">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome completo</Label>
                  <Input id="nome" placeholder="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email comercial</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="voce@seunegocio.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="empresa">Nome da empresa</Label>
                  <Input
                    id="empresa"
                    placeholder="Studio Syntax ou Barbearia Premium"
                    value={empresa}
                    onChange={(e) => setEmpresa(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telegram / Telefone</Label>
                  <Input
                    id="telefone"
                    type="tel"
                    placeholder="(11) 99999-0000"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senha">Senha</Label>
                  <Input
                    id="senha"
                    type="password"
                    placeholder="Crie uma senha"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmarSenha">Confirmar senha</Label>
                  <Input
                    id="confirmarSenha"
                    type="password"
                    placeholder="Repita a senha"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="objetivo">Como podemos ajudar?</Label>
                  <Textarea
                    id="objetivo"
                    placeholder="Conte sobre seus desafios atuais..."
                    value={objetivo}
                    onChange={(e) => setObjetivo(e.target.value)}
                    rows={4}
                  />
                </div>

                <Button type="submit" className="w-full shadow-gold" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Criando conta...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Criar minha conta
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
