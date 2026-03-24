import { Link } from "react-router-dom";
import {
  Building2,
  CalendarDays,
  Clock3,
  Gift,
  Mail,
  MessageCircle,
  NotebookPen,
  PartyPopper,
  ShieldCheck,
  Sparkles,
  Star,
  StarHalf,
  UserRound,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { ClientLoyaltyReward, ClientLoyaltySummary, fetchClientLoyalty, redeemClientReward } from "@/services/clientLoyaltyService";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

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
  const { companyInfo, client } = useClientAuth();
  const { toast } = useToast();

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
  const [loyaltySummary, setLoyaltySummary] = useState<ClientLoyaltySummary | null>(null);
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);
  const [redeemingRewardId, setRedeemingRewardId] = useState<number | null>(null);


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

  useEffect(() => {
    if (!client) {
      setLoyaltySummary(null);
      return;
    }
    setLoyaltyLoading(true);
    fetchClientLoyalty()
      .then(setLoyaltySummary)
      .catch(() => setLoyaltySummary(null))
      .finally(() => setLoyaltyLoading(false));
  }, [client]);

  const availableRewards = (loyaltySummary?.rewards ?? []).filter(
    (reward) => reward.active && (loyaltySummary?.points_balance ?? 0) >= reward.points_cost,
  );
  const pendingFreeAppointments = (loyaltySummary?.pending_redemptions ?? []).filter(
    (item) => item.reward?.grants_free_appointment,
  );
  const nextRewards = (loyaltySummary?.rewards ?? []).filter(
    (reward) => reward.active && (loyaltySummary?.points_balance ?? 0) < reward.points_cost,
  );

  const handleRedeemReward = async (reward: ClientLoyaltyReward) => {
    setRedeemingRewardId(reward.id);
    try {
      await redeemClientReward(reward.id);
      const refreshed = await fetchClientLoyalty();
      setLoyaltySummary(refreshed);
      toast({
        title: "Recompensa resgatada",
        description: `${reward.name} foi solicitada com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Não foi possível resgatar",
        description: error instanceof Error ? error.message : "Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setRedeemingRewardId(null);
    }
  };

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
        {availableRewards.length > 0 ? (
          <Alert className="border-amber-300/70 bg-amber-50 text-amber-950">
            <PartyPopper className="h-4 w-4 text-amber-600" />
            <AlertTitle>Você tem recompensa disponível</AlertTitle>
            <AlertDescription>
              {availableRewards.length === 1
                ? `Você já pode resgatar ${availableRewards[0].name}.`
                : `Você já pode resgatar ${availableRewards.length} recompensas no seu saldo atual.`}
            </AlertDescription>
          </Alert>
        ) : null}

        {pendingFreeAppointments.length > 0 ? (
          <Alert className="border-emerald-300/70 bg-emerald-50 text-emerald-950">
            <Gift className="h-4 w-4 text-emerald-600" />
            <AlertTitle>Você tem agendamento grátis pendente</AlertTitle>
            <AlertDescription>
              {pendingFreeAppointments.length === 1
                ? `Sua recompensa ${pendingFreeAppointments[0].reward.name} já pode ser usada em um novo horário.`
                : `Você tem ${pendingFreeAppointments.length} recompensas prontas para marcar horários sem custo.`}
            </AlertDescription>
          </Alert>
        ) : null}

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

        <section className="grid gap-6 mb-2 lg:grid-cols-[300px,minmax(0,1fr)]">
          <div className="space-y-6">
            <Card className="border-border/80 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-primary" />
                  Fidelidade
                </CardTitle>
                <CardDescription>Seu saldo atual e as recompensas prontas para resgate.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loyaltyLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ) : loyaltySummary ? (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                      <div className="text-5xl font-bold leading-none text-primary">{loyaltySummary.points_balance}</div>
                      <p className="mt-3 text-sm text-muted-foreground">
                        {loyaltySummary.points_balance === 1
                          ? "1 ponto disponível para usar."
                          : `${loyaltySummary.points_balance} pontos disponíveis para usar.`}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {availableRewards.length > 0 ? (
                        <Badge className="bg-amber-500 text-amber-950 hover:bg-amber-500">
                          {availableRewards.length} recompensa{availableRewards.length > 1 ? "s" : ""} disponível{availableRewards.length > 1 ? "eis" : ""}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Nenhuma recompensa liberada ainda</Badge>
                      )}
                    </div>
                    {availableRewards.length > 0 ? (
                      <div className="rounded-2xl border border-amber-300/70 bg-amber-50 p-4">
                        <p className="text-sm font-semibold text-amber-950">Pronto para resgatar</p>
                        <div className="mt-3 space-y-2">
                          {availableRewards.slice(0, 2).map((reward) => (
                            <div key={reward.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/80 px-3 py-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-foreground">{reward.name}</p>
                                <p className="text-xs text-muted-foreground">{reward.points_cost} pts</p>
                              </div>
                              <Badge className="bg-amber-500 text-amber-950 hover:bg-amber-500">Liberada</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {pendingFreeAppointments.length > 0 ? (
                      <div className="rounded-2xl border border-emerald-300/70 bg-emerald-50 p-4">
                        <p className="text-sm font-semibold text-emerald-950">Agendamento grátis pendente</p>
                        <div className="mt-3 space-y-2">
                          {pendingFreeAppointments.slice(0, 2).map((item) => (
                            <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/80 px-3 py-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-foreground">{item.reward.name}</p>
                                <p className="text-xs text-muted-foreground">Use ao marcar seu próximo horário</p>
                              </div>
                              <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Pronta</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Não foi possível carregar seu saldo de fidelidade agora.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle>Recompensas para resgate</CardTitle>
              <CardDescription>Use seus pontos sempre que alcançar o saldo necessário.</CardDescription>
            </CardHeader>
            <CardContent>
              {loyaltyLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : !loyaltySummary || loyaltySummary.rewards.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Esta barbearia ainda não cadastrou recompensas de fidelidade.
                </p>
              ) : (
                <div className="grid gap-4">
                  {loyaltySummary.rewards.map((reward) => {
                    const available = loyaltySummary.points_balance >= reward.points_cost;
                    return (
                      <div
                        key={reward.id}
                        className={`rounded-2xl border p-4 ${
                          available ? "border-amber-300/70 bg-amber-50" : "border-border/60 bg-muted/20"
                        }`}
                      >
                        <div className="flex flex-col gap-4 md:flex-row md:items-center">
                          <div className="flex h-28 w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border/60 bg-background md:w-32">
                            {reward.image_url ? (
                              <img src={reward.image_url} alt={reward.name} className="h-full w-full object-cover" />
                            ) : (
                              <Gift className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1 space-y-3">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-lg font-semibold leading-tight">{reward.name}</p>
                                {reward.description ? (
                                  <p className="mt-1 text-sm text-muted-foreground">{reward.description}</p>
                                ) : null}
                              </div>
                              <Badge variant={available ? "default" : "outline"} className="shrink-0">
                                {reward.points_cost} pts
                              </Badge>
                            </div>
                            <div className="flex flex-col gap-3 border-t border-border/50 pt-3 sm:flex-row sm:items-center sm:justify-between">
                              <p className="text-sm text-muted-foreground">
                                {available
                                  ? "Disponível para resgate agora."
                                  : `${reward.points_cost - loyaltySummary.points_balance} ponto(s) para liberar.`}
                              </p>
                              <Button
                                size="sm"
                                className="w-full sm:w-auto"
                                disabled={!available || redeemingRewardId === reward.id}
                                onClick={() => handleRedeemReward(reward)}
                              >
                                {redeemingRewardId === reward.id ? "Resgatando..." : "Resgatar"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {!loyaltyLoading && nextRewards.length > 0 ? (
                <p className="mt-4 text-xs text-muted-foreground">
                  Continue acumulando pontos para liberar as próximas recompensas.
                </p>
              ) : null}
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
