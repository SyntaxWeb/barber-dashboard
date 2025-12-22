import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CalendarCheck2, Clock3, LogIn, ShieldCheck, UserPlus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { fetchEmpresaPublic, type EmpresaInfo } from "@/services/companyService";
import { useClientAuth } from "@/contexts/ClientAuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import defaultLogo from "@/assets/syntax-logo.svg";

export default function PublicAgendamento() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, setCompanySlug } = useClientAuth();
  const { palettes } = useTheme();
  const clientTheme = palettes.client;

  const [empresa, setEmpresa] = useState<EmpresaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const lastRequestRef = useRef<{ slug: string; timestamp: number } | null>(null);

  const shouldFetch = useCallback((currentSlug: string) => {
    const now = Date.now();
    const lastRequest = lastRequestRef.current;
    const MIN_FETCH_INTERVAL = 30 * 1000;

    if (!lastRequest) {
      lastRequestRef.current = { slug: currentSlug, timestamp: now };
      return true;
    }

    if (lastRequest.slug !== currentSlug || now - lastRequest.timestamp > MIN_FETCH_INTERVAL) {
      lastRequestRef.current = { slug: currentSlug, timestamp: now };
      return true;
    }

    return false;
  }, []);

  useEffect(() => {
    if (!slug) return;
    if (!shouldFetch(slug)) {
      return;
    }
    setLoading(true);
    fetchEmpresaPublic(slug)
      .then((data) => {
        setEmpresa(data);
        setCompanySlug(slug, data);
      })
      .catch(() => {
        toast({
          title: "Empresa não encontrada",
          description: "Verifique se o link foi digitado corretamente.",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [setCompanySlug, shouldFetch, slug, toast]);

  const goTo = (path: string) => {
    if (!slug) return;
    navigate(`${path}?company=${slug}`);
  };

  const handlePrimaryAction = () => {
    goTo(isAuthenticated ? "/cliente/agendar" : "/cliente/login");
  };

  const guideSteps = [
    {
      title: "Identifique-se",
      description: "Entrar garante que só você veja seus dados e histórico.",
      icon: ShieldCheck,
    },
    {
      title: "Escolha o serviço",
      description: "Veja valores, duração e profissionais disponíveis.",
      icon: CalendarCheck2,
    },
    {
      title: "Confirme",
      description: "Receba confirmação e lembretes automáticos.",
      icon: Clock3,
    },
  ];

  const onboardingCards = [
    {
      title: "Já tenho conta",
      description: "Acesse com seu email e veja horários disponíveis.",
      detail:
        "Entrando você enxerga horários livres, confirma serviços e acompanha todos os seus atendimentos.",
      icon: LogIn,
      action: () => goTo("/cliente/login"),
      buttonLabel: "Entrar com meu email",
      variant: "default" as const,
    },
    {
      title: "Primeiro atendimento",
      description: "Crie sua conta gratuita para guardar históricos.",
      detail:
        "Com uma única conta você agenda em diversas empresas que usam SyntaxAtendimento.",
      icon: UserPlus,
      action: () => goTo("/cliente/registro"),
      buttonLabel: "Criar conta gratuita",
      variant: "secondary" as const,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Preparando a agenda pública...</p>
        </div>
      </div>
    );
  }

  if (!empresa || !slug) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
        <Card className="max-w-md border-border shadow-gold">
          <CardHeader>
            <CardTitle>Link inválido</CardTitle>
            <CardDescription>Peça um novo link para o prestador ou tente novamente.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" onClick={() => navigate("/")}>
              Voltar ao início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const primaryLabel = isAuthenticated ? "Abrir agenda agora" : "Entrar e agendar";

  return (
    <div
      className="min-h-screen py-10 px-4"
      style={{
        background: `linear-gradient(180deg, ${clientTheme.background} 0%, ${clientTheme.surface} 60%, #ffffff 100%)`,
      }}
    >
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <Button variant="ghost" className="w-fit -ml-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <Card className="border-border shadow-gold/40">
          <CardContent className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white border border-border shadow-inner overflow-hidden">
                <img src={empresa.icon_url ?? defaultLogo} alt={empresa.nome} className="h-full w-full object-cover" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-wide text-muted-foreground">Agenda oficial</p>
                <h1 className="text-3xl font-bold text-foreground">{empresa.nome}</h1>
                <p className="text-muted-foreground">
                  {empresa.descricao || "Escolha seu serviço, confirme o horário e receba lembretes automáticos."}
                </p>
              </div>
            </div>
            <div className="rounded-2xl bg-gradient-to-r from-white to-muted/50 p-5 space-y-5">
              <div className="flex flex-col gap-4 lg:flex-row">
                <div className="flex flex-1 flex-col gap-2 p-2 rounded-2xl bg-primary/10 p-5 text-sm text-primary">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary/70">Comece por aqui</p>
                  <h2 className="text-2xl font-bold text-primary">Reserve em poucos minutos</h2>
                  <p className="text-sm text-primary/80">
                    Entrando você acessa o painel seguro da empresa, escolhe um serviço, confirma o horário e recebe
                    lembretes automáticos.
                  </p>
                </div>
                <div className="flex flex-1 flex-col gap-3">
                  <Button className="w-full py-5 text-base font-semibold shadow-lg shadow-primary/20" onClick={handlePrimaryAction}>
                    {primaryLabel}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full py-5 text-base font-semibold border border-primary/30 bg-white text-primary shadow"
                    onClick={() => goTo("/cliente/registro")}
                  >
                    Criar minha conta
                  </Button>
                </div>
              </div>
              <Separator />
              <div className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-3">
                {guideSteps.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.title} className="flex items-start gap-3 rounded-2xl bg-primary/10 p-4 shadow-sm">
                      <div className="rounded-full bg-muted p-2">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{step.title}</p>
                        <p>{step.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {onboardingCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.title} className="border-border/70 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Icon className="h-5 w-5 text-primary" />
                    {card.title}
                  </CardTitle>
                  <CardDescription>{card.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{card.detail}</p>
                  <Button
                    variant={card.variant === "secondary" ? "destructive" : "default"}
                    className={`w-full py-4 text-base font-semibold ${
                      card.variant === "secondary" ? "" : "bg-primary text-primary-foreground shadow-gold"
                    }`}
                    onClick={card.action}
                  >
                    {card.buttonLabel}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
