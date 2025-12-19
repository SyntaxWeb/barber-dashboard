import { Link } from "react-router-dom";
import {
  Building2,
  CalendarDays,
  Clock3,
  Mail,
  MessageCircle,
  NotebookPen,
  ShieldCheck,
  Sparkles,
  Star,
  StarHalf,
  UserRound,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClientPortalLayout } from "@/components/layout/ClientPortalLayout";
import { useClientAuth } from "@/contexts/ClientAuthContext";
import defaultLogo from "@/assets/syntax-logo.svg";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { clientFetchFeedbackSummary, CompanyFeedbackSummary } from "@/services/clientPortalService";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const quickActions = [
  {
    title: "Agendar atendimento",
    description: "Escolha serviço, profissional e horário em poucos passos.",
    to: "/cliente/agendar",
    icon: NotebookPen,
  },
  {
    title: "Acompanhar horários",
    description: "Veja reservas futuras, edite ou cancele rapidamente.",
    to: "/cliente/agendamentos",
    icon: CalendarDays,
  },
  {
    title: "Atualizar meus dados",
    description: "Mantenha telefone, foto e preferências sempre em dia.",
    to: "/cliente/perfil",
    icon: UserRound,
  },
];

export default function ClienteDashboard() {
  const { companyInfo } = useClientAuth();
  console.log(companyInfo)

  const companyName = companyInfo?.nome ?? "Barbearia";
  const companyDescription =
    companyInfo?.descricao ??
    "Aqui você encontra atendimento próximo, horários flexíveis e profissionais prontos para cuidar do seu estilo.";
  const companyIcon = companyInfo?.icon_url ?? defaultLogo;
  const galleryPhotos = Array.isArray(companyInfo?.gallery_photos) ? companyInfo.gallery_photos : [];
  const contactEmail = companyInfo?.notify_email ?? "Não informado";
  const contactTelegram = companyInfo?.notify_telegram ?? "Não informado";
  const schedulingLink = companyInfo?.agendamento_url ?? null;
  const slugLabel = companyInfo?.slug ? `/${companyInfo.slug}` : null;
  const [feedbackSummary, setFeedbackSummary] = useState<CompanyFeedbackSummary | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);


  useEffect(() => {
    if (!companyInfo) {
      setFeedbackSummary(null);
      return;
    }
    setFeedbackLoading(true);
    clientFetchFeedbackSummary(companyInfo.slug)
      .then(setFeedbackSummary)
      .catch(() => setFeedbackSummary(null))
      .finally(() => setFeedbackLoading(false));
  }, [companyInfo]);

  const renderStars = (value?: number | null, size: "md" | "sm" = "md") => {
    const rating = Math.min(Math.max(value ?? 0, 0), 5);
    const fullStars = Math.floor(rating);
    const hasHalf = rating - fullStars >= 0.5;
    const iconClass = size === "sm" ? "h-4 w-4" : "h-5 w-5";

    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, index) => {
          const position = index + 1;

          if (position <= fullStars) {
            return <Star key={position} className={cn(iconClass, "text-amber-500 fill-amber-500")} />;
          }

          if (hasHalf && position === fullStars + 1) {
            return <StarHalf key={position} className={cn(iconClass, "text-amber-500 fill-amber-500")} />;
          }

          return <Star key={position} className={cn(iconClass, "text-muted-foreground")} />;
        })}
      </div>
    );
  };

  const formatFeedbackTimestamp = (value?: string | null) => {
    if (!value) return "há pouco";
    try {
      return formatDistanceToNow(new Date(value), { locale: ptBR, addSuffix: true });
    } catch {
      return "há pouco";
    }
  };
  return (
    <ClientPortalLayout>
      <div className="space-y-8">

        <section className="grid gap-6 mb-2">
          <Card className="border-border/80 shadow-sm overflow-hidden">
            <CardHeader>
              <CardTitle>Galeria da barbearia</CardTitle>
              <CardDescription>Confira fotos enviadas pelo barbeiro.</CardDescription>
            </CardHeader>
            <CardContent>
              {galleryPhotos.length ? (
                <div className="space-y-3">
                  <Carousel opts={{ loop: true }}>
                    <CarouselContent>
                      {galleryPhotos.map((photo, index) => (
                        <CarouselItem key={`${photo}-${index}`}>
                          <div className="relative h-56 w-full overflow-hidden rounded-2xl border border-border/60 bg-muted">
                            <img src={photo} alt={`Foto ${index + 1} da barbearia`} className="h-full w-full object-cover" />
                            <div className="absolute bottom-3 right-3 rounded-full bg-background/80 px-3 py-1 text-xs font-semibold shadow">
                              {index + 1} / {galleryPhotos.length}
                            </div>
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="bg-background/80" />
                    <CarouselNext className="bg-background/80" />
                  </Carousel>
                  <p className="text-xs text-muted-foreground">
                    Atualize sempre que quiser conferir novidades do espaço.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border/70 p-6 text-sm text-muted-foreground">
                  Em breve você verá aqui as fotos compartilhadas pela barbearia.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-gold/30">
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Feedback dos clientes</CardTitle>
                <CardDescription>
                  Veja como outros clientes avaliam{" "}
                  <span className="font-semibold text-foreground">{companyInfo?.nome ?? "esta barbearia"}</span>.
                </CardDescription>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">
                  {typeof feedbackSummary?.average === "number" ? feedbackSummary.average.toFixed(1) : "--"}
                </p>
                <p className="text-xs text-muted-foreground">de 5</p>
              </div>
            </CardHeader>
            <CardContent>
              {feedbackLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-5 w-44" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : feedbackSummary && feedbackSummary.count > 0 ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    {renderStars(feedbackSummary.average)}
                    <span className="text-sm text-muted-foreground">
                      {feedbackSummary.count} {feedbackSummary.count === 1 ? "avaliação" : "avaliações"}
                    </span>
                  </div>
                  <div className="grid gap-3">
                    {feedbackSummary.recent.slice(0, 2).map((feedback) => (
                      <div key={feedback.id} className="rounded-xl border border-border/60 bg-muted/30 p-3">
                        <div className="flex items-center justify-between text-sm font-semibold text-foreground">
                          <span>{feedback.client_name ?? "Cliente"}</span>
                          <span className="text-xs font-normal text-muted-foreground">
                            {formatFeedbackTimestamp(feedback.created_at)}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-sm">
                          {renderStars(feedback.rating, "sm")}
                          <span className="text-xs text-muted-foreground">{feedback.rating.toFixed(1)} / 5</span>
                        </div>
                        {feedback.comment && (
                          <p className="mt-2 text-sm leading-relaxed text-foreground">{feedback.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Ainda não há feedbacks publicados para esta empresa. Seja o primeiro a deixar sua opinião após o
                  atendimento!
                </p>
              )}
            </CardContent>
          </Card>
        </section>
        <section className="grid gap-6 mb-2">
          <Card className="border-none bg-white/95  from-white to-muted shadow-md shadow-primary/5">
            <CardHeader className="flex flex-col  gap-4 xl:flex-row xl:items-center">
              <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-3xl border border-border/60 bg-white shadow-inner overflow-hidden">
                <img src={companyIcon} alt={companyName} className="h-full w-full object-cover" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <CardTitle className="text-3xl">{companyName}</CardTitle>
                  {slugLabel && <Badge variant="secondary">{slugLabel}</Badge>}
                </div>
                <CardDescription className="text-base text-foreground/80">{companyDescription}</CardDescription>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline" className="border-primary/40 text-primary">
                    Agenda 100% digital
                  </Badge>
                  <Badge variant="outline" className="border-emerald-300 text-emerald-700">
                    Lembretes automáticos ativos
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4">
                <div className="rounded-2xl border border-border/70 bg-white/80 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Mail className="h-4 w-4 text-primary" />
                    E-mail da equipe
                  </div>
                  <p className="mt-2 text-sm font-medium text-foreground">{contactEmail}</p>
                  <p className="text-xs text-muted-foreground">Confirmações, reagendamentos e recibos chegam por aqui.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild className="shadow-gold">
                  <Link to="/cliente/agendar">Novo agendamento</Link>
                </Button>

              </div>
            </CardContent>
          </Card>



        </section>

        <section className="grid gap-4 lg:grid-cols-3 mb-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card
                key={action.to}
                className="border border-border/70 bg-white transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="h-5 w-5 text-primary" />
                    {action.title}
                  </CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link to={action.to}>Acessar</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.4fr,1fr] mb-2">
          <Card className="border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Estrutura e ambiente
              </CardTitle>
              <CardDescription>Uma experiência pensada para te receber bem.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Chegue alguns minutos antes para alinhar detalhes do corte e aproveitar o café da casa. A equipe acompanha cada
                agendamento e envia lembretes automáticos para evitar imprevistos.
              </p>
              <p>
                Se precisar ajustar o horário, use o menu lateral ou responda ao e-mail/telegram informado acima. Procuramos ser
                o mais flexíveis possível para encaixar você na agenda.
              </p>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="border-slate-300 text-slate-700">
                  <ShieldCheck className="mr-1 h-3 w-3" />
                  Ferramentas higienizadas a cada atendimento
                </Badge>
                <Badge variant="outline" className="border-slate-300 text-slate-700">
                  <Sparkles className="mr-1 h-3 w-3" />
                  Produtos premium incluídos
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-primary/30 bg-white shadow-lg shadow-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock3 className="h-5 w-5 text-primary" />
                Dica rápida
              </CardTitle>
              <CardDescription>Como aproveitar melhor seu painel.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>Use o menu lateral ou os atalhos abaixo para:</p>
              <ul className="space-y-2 text-foreground/80">
                <li>• Agendar novos horários em poucos toques;</li>
                <li>• Conferir o histórico e reagendar rapidamente;</li>
                <li>• Atualizar dados para receber alertas no canal certo.</li>
              </ul>
              <div className="rounded-2xl border border-dashed border-border/80 p-3 text-xs text-muted-foreground">
                Dica: mantenha telefone e e-mail atualizados para não perder confirmações automáticas.
              </div>
            </CardContent>
          </Card>

        </section>
      </div>
    </ClientPortalLayout>
  );
}
