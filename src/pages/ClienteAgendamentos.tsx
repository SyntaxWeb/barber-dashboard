import { useCallback, useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  Clock,
  Scissors,
  NotebookPen,
  XCircle,
  ArrowLeft,
  Star,
  CheckCircle2,
  Link2Off,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useClientAuth } from "@/contexts/ClientAuthContext";
import {
  ClientAppointment,
  clientFetchAgendamentos,
  clientCancelarAgendamento,
  clientFetchServicos,
  clientFetchHorarios,
  clientUpdateAgendamento,
  clientEnviarFeedback,
  ClientAppointmentFeedbackPayload,
} from "@/services/clientPortalService";
import { Servico } from "@/data/mockData";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ClientPortalLayout } from "@/components/layout/ClientPortalLayout";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import defaultLogo from "@/assets/syntax-logo.svg";
import { AvailabilityData, joinHorario, splitHorario } from "@/lib/availability";

const createFeedbackDefaults = (): ClientAppointmentFeedbackPayload => ({
  service_rating: 5,
  professional_rating: 5,
  scheduling_rating: 5,
  comment: "",
  allow_public_testimonial: false,
});

type FeedbackStep = "form" | "success" | "already" | "expired";

const averageFeedbackScore = (feedback?: ClientAppointment["feedback"]) => {
  if (!feedback) return null;
  const scores = [feedback.service_rating, feedback.professional_rating, feedback.scheduling_rating].filter(
    (value) => typeof value === "number" && !Number.isNaN(value),
  );
  if (scores.length === 0) return null;
  const total = scores.reduce((sum, value) => sum + value, 0);
  return (total / scores.length).toFixed(1);
};

export default function ClienteAgendamentos() {
  const { token, companySlug, companyInfo } = useClientAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  const [appointments, setAppointments] = useState<ClientAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [editAppointment, setEditAppointment] = useState<ClientAppointment | null>(null);
  const [editServiceId, setEditServiceId] = useState("");
  const [editDate, setEditDate] = useState<Date | undefined>(undefined);
  const [editHora, setEditHora] = useState("");
  const [editMinuto, setEditMinuto] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editAvailability, setEditAvailability] = useState<AvailabilityData>({
    horarios: [],
    horas: [],
    minutosPorHora: {},
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [feedbackAppointment, setFeedbackAppointment] = useState<ClientAppointment | null>(null);
  const [feedbackValues, setFeedbackValues] = useState<ClientAppointmentFeedbackPayload>(createFeedbackDefaults);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackStep, setFeedbackStep] = useState<FeedbackStep>("form");
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackParamHandled, setFeedbackParamHandled] = useState(false);
  const feedbackQuestions: Array<{
    key: "service_rating" | "professional_rating" | "scheduling_rating";
    label: string;
  }> = [
    { key: "service_rating", label: "Como você avalia o serviço prestado?" },
    { key: "professional_rating", label: "Como foi o atendimento do profissional?" },
    { key: "scheduling_rating", label: "O que achou da experiência com o sistema de agendamento?" },
  ];

  const activeCompany = companySlug;
  const companyName = companyInfo?.nome ?? "Barbearia";
  const companyIcon = companyInfo?.icon_url ?? defaultLogo;
  const companyDescription =
    companyInfo?.descricao ?? "Conheça os serviços, acompanhe seus horários e fale com a equipe sempre que precisar.";
  const galleryPhotos = Array.isArray(companyInfo?.gallery_photos) ? companyInfo.gallery_photos : [];
  const schedulingLink = companyInfo?.agendamento_url ?? null;
  const contactEmail = companyInfo?.notify_email ?? null;
  const contactTelegram = companyInfo?.notify_telegram ?? null;
  const companySlugLabel = companyInfo?.slug ? `/${companyInfo.slug}` : null;

  const loadAppointments = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await clientFetchAgendamentos(token);
      setAppointments(data);
    } catch (error) {
      toast({
        title: "Erro ao buscar agendamentos",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    loadAppointments();
  }, [token]);

  useEffect(() => {
    if (!activeCompany) return;
    clientFetchServicos(activeCompany)
      .then(setServicos)
      .catch(() => setServicos([]));
  }, [activeCompany]);

  useEffect(() => {
    if (!editAppointment || !editDate || !activeCompany || !editServiceId) {
      setEditAvailability({ horarios: [], horas: [], minutosPorHora: {} });
      setEditHora("");
      setEditMinuto("");
      return;
    }
    setLoadingHorarios(true);
    clientFetchHorarios(format(editDate, "yyyy-MM-dd"), activeCompany, Number(editServiceId), editAppointment.id)
      .then((dataResponse) => {
        setEditAvailability(dataResponse);
      })
      .finally(() => setLoadingHorarios(false));
  }, [editAppointment, editDate, activeCompany, editServiceId]);

  useEffect(() => {
    if (!editHora) {
      if (editMinuto) setEditMinuto("");
      return;
    }
    if (!editAvailability.horas.includes(editHora)) {
      setEditHora("");
      setEditMinuto("");
      return;
    }
    const minutosDisponiveis = editAvailability.minutosPorHora[editHora] ?? [];
    if (!minutosDisponiveis.includes(editMinuto) && editMinuto) {
      setEditMinuto("");
    }
  }, [editAvailability, editHora, editMinuto]);

  const statusBadge = useMemo(
    () => ({
      confirmado: { label: "Confirmado", className: "bg-primary text-primary-foreground" },
      concluido: { label: "Concluído", className: "bg-emerald-500 text-white" },
      cancelado: { label: "Cancelado", className: "bg-destructive text-destructive-foreground" },
    }),
    [],
  );

  const canCancel = (appointment: ClientAppointment) => {
    if (appointment.status !== "confirmado") return false;
    const start = new Date(`${appointment.data}T${appointment.horario}:00`);
    const diffMinutes = (start.getTime() - Date.now()) / (1000 * 60);
    return diffMinutes >= 60;
  };
  const canEdit = (appointment: ClientAppointment) => {
    if (appointment.status !== "confirmado") return false;
    const start = new Date(`${appointment.data}T${appointment.horario}:00`);
    const diffMinutes = (start.getTime() - Date.now()) / (1000 * 60);
    return diffMinutes >= 60;
  };
  const canGiveFeedback = (appointment: ClientAppointment) => appointment.status === "concluido";
  const minutosEditDisponiveis = editHora ? editAvailability.minutosPorHora[editHora] ?? [] : [];

  const handleCancel = async (appointment: ClientAppointment) => {
    if (!token) return;
    if (!canCancel(appointment)) {
      toast({
        title: "Cancelamento indisponível",
        description: "Só é possível cancelar até 1 hora antes do horário marcado.",
        variant: "destructive",
      });
      return;
    }
    try {
      await clientCancelarAgendamento(appointment.id, token);
      toast({
        title: "Agendamento cancelado",
        description: `${appointment.servico} em ${format(parseISO(appointment.data), "dd/MM")} às ${
          appointment.horario
        }`,
      });
      loadAppointments();
    } catch (error) {
      toast({
        title: "Erro ao cancelar",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const openFeedbackDialog = useCallback((appointment: ClientAppointment) => {
    const baseValues = createFeedbackDefaults();
    if (appointment.feedback) {
      baseValues.service_rating = appointment.feedback.service_rating ?? baseValues.service_rating;
      baseValues.professional_rating = appointment.feedback.professional_rating ?? baseValues.professional_rating;
      baseValues.scheduling_rating = appointment.feedback.scheduling_rating ?? baseValues.scheduling_rating;
      baseValues.comment = appointment.feedback.comment ?? "";
      baseValues.allow_public_testimonial = !!appointment.feedback.allow_public_testimonial;
    }
    setFeedbackValues(baseValues);
    setFeedbackAppointment(appointment);
    setFeedbackStep(appointment.feedback ? "already" : "form");
    setFeedbackError(null);
  }, []);

  const closeFeedbackDialog = useCallback(() => {
    setFeedbackAppointment(null);
    setFeedbackValues(createFeedbackDefaults());
    setFeedbackStep("form");
    setFeedbackError(null);
    setFeedbackSubmitting(false);
  }, []);

  const handleFeedbackSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!feedbackAppointment || !token) {
      toast({
        title: "Sessão expirada",
        description: "Faça login novamente para continuar.",
        variant: "destructive",
      });
      navigate("/cliente/login");
      return;
    }
    setFeedbackSubmitting(true);
    setFeedbackError(null);
    try {
      await clientEnviarFeedback(feedbackAppointment.id, feedbackValues, token);
      setFeedbackStep("success");
      toast({
        title: "Feedback enviado",
        description: "Sua opinião ajuda a melhorar os próximos atendimentos. Obrigado!",
      });
      loadAppointments();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Não foi possível enviar seu feedback. Tente novamente.";
      setFeedbackError(message);
      if (/expirad/i.test(message)) {
        setFeedbackStep("expired");
      } else {
        toast({
          title: "Erro ao enviar",
          description: message,
          variant: "destructive",
        });
      }
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const openEdit = (appointment: ClientAppointment) => {
    setEditAppointment(appointment);
    setEditServiceId(appointment.service_id?.toString() ?? "");
    setEditDate(parseISO(`${appointment.data}T00:00:00`));
    const { hora, minuto } = splitHorario(appointment.horario);
    setEditHora(hora);
    setEditMinuto(minuto);
    setEditNotes(appointment.observacoes ?? "");
  };

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    const horarioSelecionado = joinHorario(editHora, editMinuto);
    if (!editAppointment || !token || !activeCompany || !editDate || !editServiceId || !horarioSelecionado) {
      toast({
        title: "Preencha todos os campos",
        description: "Selecione serviço, data e horário disponíveis.",
        variant: "destructive",
      });
      return;
    }
    setSavingEdit(true);
    try {
      await clientUpdateAgendamento(
        editAppointment.id,
        {
          service_id: Number(editServiceId),
          data: format(editDate, "yyyy-MM-dd"),
          horario: horarioSelecionado,
          observacoes: editNotes.trim() || undefined,
        },
        token,
        activeCompany,
      );
      toast({
        title: "Agendamento atualizado",
        description: `${format(editDate, "dd/MM")} às ${horarioSelecionado}`,
      });
      setEditAppointment(null);
      loadAppointments();
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSavingEdit(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
        <Card className="max-w-md text-center border-border shadow-gold">
          <CardHeader>
            <CardTitle>Faça login</CardTitle>
            <CardDescription>Entre na sua conta de cliente para visualizar seus agendamentos.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate("/cliente/login")}>
              Ir para o login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  useEffect(() => {
    if (feedbackParamHandled) return;
    const pendingFeedbackId = searchParams.get("feedback");
    if (!pendingFeedbackId) return;
    const parsedId = Number(pendingFeedbackId);
    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      setFeedbackParamHandled(true);
      return;
    }
    if (loading) return;
    const targetAppointment = appointments.find((appointment) => appointment.id === parsedId);
    if (!targetAppointment) return;
    openFeedbackDialog(targetAppointment);
    setFeedbackParamHandled(true);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("feedback");
    setSearchParams(nextParams, { replace: true });
  }, [appointments, loading, openFeedbackDialog, searchParams, setSearchParams, feedbackParamHandled]);

  return (
    <ClientPortalLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" className="inline-flex items-center gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <Button variant="secondary" size="sm" onClick={() => navigate("/cliente/agendar")}>
            <NotebookPen className="mr-2 h-4 w-4" />
            Novo agendamento
          </Button>
        </div>

        <Card className="border-border shadow-gold/40">
          <CardHeader>
            <CardTitle>Meus agendamentos</CardTitle>
            <CardDescription>
              {companyInfo?.nome
                ? `Reservas feitas na empresa ${companyInfo.nome}.`
                : "Acompanhe, reagende ou cancele seus horários confirmados."}
            </CardDescription>
          </CardHeader>
        </Card>

        {loading ? (
          <Card className="border-border shadow-gold/20">
            <CardContent className="py-12 text-center text-muted-foreground">Carregando agendamentos...</CardContent>
          </Card>
        ) : appointments.length === 0 ? (
          <Card className="border-dashed border-border/60 text-center shadow-none">
            <CardHeader>
              <CardTitle>Nenhum agendamento encontrado</CardTitle>
              <CardDescription>Assim que você reservar um horário aqui ele aparecerá.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/cliente/agendar")}>Agendar agora</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => {
              const status = statusBadge[appointment.status] ?? statusBadge.confirmado;
              const dateFormatted = format(parseISO(`${appointment.data}T00:00:00`), "EEEE, dd 'de' MMMM", {
                locale: ptBR,
              });
              return (
                <Card key={appointment.id} className="border-border shadow-sm">
                  <CardContent className="flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Scissors className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-lg">{appointment.servico}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(parseISO(`${appointment.data}T00:00:00`), "dd/MM/yyyy")} às {appointment.horario}
                          </p>
                          {appointment.company?.nome && (
                            <p className="text-xs text-muted-foreground">
                              Empresa: <span className="font-medium text-foreground">{appointment.company.nome}</span>
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="h-4 w-4" /> {dateFormatted}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" /> {appointment.horario}
                        </span>
                        {appointment.preco !== undefined && (
                          <span className="flex items-center gap-1">
                            R$ {Number(appointment.preco).toFixed(2)}
                          </span>
                        )}
                      </div>
                      {appointment.observacoes && (
                        <p className="text-sm text-muted-foreground">Observações: {appointment.observacoes}</p>
                      )}
                    </div>
                      <div className="flex flex-col items-start gap-3 md:items-end">
                        <Badge className={status.className}>{status.label}</Badge>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                          size="sm"
                          disabled={!canEdit(appointment)}
                          onClick={() => openEdit(appointment)}
                        >
                          <NotebookPen className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={!canCancel(appointment)}
                          onClick={() => handleCancel(appointment)}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Cancelar
                        </Button>
                        </div>
                        {!canCancel(appointment) && appointment.status === "confirmado" && (
                          <p className="text-xs text-muted-foreground max-w-xs text-right">
                            Cancelamento disponível até 1 hora antes do início.
                          </p>
                        )}
                        {canGiveFeedback(appointment) && (
                          <div className="w-full">
                            {appointment.feedback ? (
                              <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-900">
                                <p className="font-semibold text-sm text-emerald-900">Feedback enviado</p>
                                <p className="mt-1 text-emerald-900/80">
                                  {averageFeedbackScore(appointment.feedback)
                                    ? `Média ${averageFeedbackScore(appointment.feedback)} / 5`
                                    : "Obrigado por compartilhar sua opinião!"}
                                </p>
                                <Button
                                  type="button"
                                  variant="link"
                                  size="sm"
                                  className="px-0 text-emerald-900 hover:text-emerald-700"
                                  onClick={() => openFeedbackDialog(appointment)}
                                >
                                  Ver ou atualizar feedback
                                </Button>
                              </div>
                            ) : (
                              <Button variant="secondary" size="sm" onClick={() => openFeedbackDialog(appointment)}>
                                <Star className="mr-2 h-4 w-4" />
                                Avaliar atendimento
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!editAppointment} onOpenChange={(open) => (!open ? setEditAppointment(null) : null)}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleUpdate} className="space-y-5">
            <DialogHeader>
              <DialogTitle>Editar agendamento</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Label>Serviço</Label>
              <Select value={editServiceId} onValueChange={setEditServiceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um serviço" />
                </SelectTrigger>
                <SelectContent>
                  {servicos.map((servico) => (
                    <SelectItem key={servico.id} value={servico.id.toString()}>
                      {servico.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !editDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editDate ? format(editDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "Escolha uma data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={editDate}
                    onSelect={setEditDate}
                    initialFocus
                    locale={ptBR}
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Horário</Label>
              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={editHora}
                  onValueChange={(value) => {
                    setEditHora(value);
                    setEditMinuto("");
                  }}
                  disabled={loadingHorarios || !editDate || !editServiceId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingHorarios ? "Carregando..." : "Hora"} />
                  </SelectTrigger>
                  <SelectContent>
                    {!editServiceId && (
                      <div className="px-3 py-2 text-sm text-muted-foreground">Selecione um serviço primeiro</div>
                    )}
                    {editServiceId && editAvailability.horas.length === 0 && !loadingHorarios ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">Nenhuma hora disponível</div>
                    ) : (
                      editAvailability.horas.map((hora) => (
                        <SelectItem key={hora} value={hora}>
                          {hora}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Select
                  value={editMinuto}
                  onValueChange={setEditMinuto}
                  disabled={loadingHorarios || !editHora}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Minuto" />
                  </SelectTrigger>
                  <SelectContent>
                    {!editHora && (
                      <div className="px-3 py-2 text-sm text-muted-foreground">Selecione uma hora</div>
                    )}
                    {editHora && minutosEditDisponiveis.length === 0 && !loadingHorarios ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">Nenhum minuto disponível</div>
                    ) : (
                      minutosEditDisponiveis.map((minuto) => (
                        <SelectItem key={minuto} value={minuto}>
                          {minuto}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={editNotes}
                onChange={(event) => setEditNotes(event.target.value)}
                placeholder="Compartilhe alguma informação importante (opcional)"
              />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="ghost" onClick={() => setEditAppointment(null)}>
                Fechar
              </Button>
              <Button type="submit" disabled={savingEdit}>
                {savingEdit ? "Salvando..." : "Salvar alterações"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={!!feedbackAppointment} onOpenChange={(open) => (!open ? closeFeedbackDialog() : null)}>
        <DialogContent className="sm:max-w-lg">
          {feedbackStep === "success" ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">Obrigadaço!</p>
                <p className="text-sm text-muted-foreground">
                  Sua opinião chegou direitinho e já está ajudando nosso time.
                </p>
              </div>
              <Button onClick={closeFeedbackDialog} className="w-full">
                Fechar
              </Button>
            </div>
          ) : feedbackStep === "already" ? (
            <div className="space-y-4 text-center">
              <p className="text-lg font-semibold text-foreground">Feedback já enviado</p>
              <p className="text-sm text-muted-foreground">
                Você já nos contou tudo por aqui. Se quiser atualizar, fale com a gente ✂️
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="secondary" className="flex-1" onClick={() => setFeedbackStep("form")}>
                  Editar resposta
                </Button>
                <Button variant="ghost" className="flex-1" onClick={closeFeedbackDialog}>
                  Voltar
                </Button>
              </div>
            </div>
          ) : feedbackStep === "expired" ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Link2Off className="h-6 w-6" />
              </div>
              <p className="text-lg font-semibold text-foreground">Link expirado</p>
              <p className="text-sm text-muted-foreground">
                Ops, esse link não vale mais. Mas estamos por aqui para ouvir você!
              </p>
              <Button variant="outline" className="w-full" onClick={closeFeedbackDialog}>
                Pedir novo link
              </Button>
            </div>
          ) : (
            <form onSubmit={handleFeedbackSubmit} className="space-y-5">
              <DialogHeader>
                <DialogTitle>Avaliar atendimento</DialogTitle>
                <p className="text-sm text-muted-foreground">Leva menos de 1 minuto 😊</p>
                {feedbackAppointment && (
                  <p className="text-xs text-muted-foreground">
                    {feedbackAppointment.servico} •{" "}
                    {format(parseISO(`${feedbackAppointment.data}T00:00:00`), "dd/MM/yyyy")} às{" "}
                    {feedbackAppointment.horario}
                  </p>
                )}
              </DialogHeader>
              <div className="space-y-4">
                {feedbackQuestions.map((question) => (
                  <RatingQuestion
                    key={question.key}
                    label={question.label}
                    value={feedbackValues[question.key]}
                    onChange={(value) =>
                      setFeedbackValues((current) => ({
                        ...current,
                        [question.key]: value,
                      }))
                    }
                  />
                ))}
              </div>
              <div className="space-y-2">
                <Label htmlFor="feedback-comment">Quer deixar um comentário ou sugestão?</Label>
                <Textarea
                  id="feedback-comment"
                  value={feedbackValues.comment ?? ""}
                  onChange={(event) =>
                    setFeedbackValues((current) => ({
                      ...current,
                      comment: event.target.value,
                    }))
                  }
                  placeholder="Conte pra gente rapidinho o que podemos melhorar (opcional)"
                />
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-border/60 p-3">
                <Checkbox
                  id="feedback-consent"
                  checked={feedbackValues.allow_public_testimonial ?? false}
                  onCheckedChange={(checked) =>
                    setFeedbackValues((current) => ({
                      ...current,
                      allow_public_testimonial: checked === true,
                    }))
                  }
                />
                <div className="space-y-1 text-sm">
                  <Label htmlFor="feedback-consent" className="font-medium">
                    Você autoriza que esse comentário seja usado como depoimento público?
                  </Label>
                  <p className="text-xs text-muted-foreground">Só publicamos se você permitir, combinado?</p>
                </div>
              </div>
              {feedbackError && <p className="text-sm text-destructive">{feedbackError}</p>}
              <DialogFooter className="gap-2">
                <Button type="button" variant="ghost" onClick={closeFeedbackDialog}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={feedbackSubmitting}>
                  {feedbackSubmitting ? "Enviando..." : "Enviar feedback"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </ClientPortalLayout>
  );
}

interface RatingQuestionProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

const RatingQuestion = ({ label, value, onChange }: RatingQuestionProps) => (
  <div className="space-y-2">
    <Label className="text-sm font-medium text-foreground">{label}</Label>
    <div className="flex items-center gap-2">
      {Array.from({ length: 5 }).map((_, index) => {
        const position = index + 1;
        const active = position <= value;
        return (
          <button
            type="button"
            key={position}
            onClick={() => onChange(position)}
            className="rounded-full p-1 transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={`Selecionar ${position} de 5 estrelas`}
          >
            <Star
              className={cn("h-6 w-6", active ? "fill-amber-500 text-amber-500" : "text-muted-foreground")}
              aria-hidden="true"
            />
          </button>
        );
      })}
      <span className="text-xs text-muted-foreground">{value} / 5</span>
    </div>
  </div>
);
