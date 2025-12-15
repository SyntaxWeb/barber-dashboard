import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  Clock,
  Scissors,
  NotebookPen,
  Undo2,
  XCircle,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useClientAuth } from "@/contexts/ClientAuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  ClientAppointment,
  clientFetchAgendamentos,
  clientCancelarAgendamento,
  clientFetchServicos,
  clientFetchHorarios,
  clientUpdateAgendamento,
} from "@/services/clientPortalService";
import { Servico } from "@/data/mockData";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function ClienteAgendamentos() {
  const { client, token, companySlug, companyInfo } = useClientAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { palettes } = useTheme();
  const clientPalette = palettes.client;

  const [appointments, setAppointments] = useState<ClientAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [editAppointment, setEditAppointment] = useState<ClientAppointment | null>(null);
  const [editServiceId, setEditServiceId] = useState("");
  const [editDate, setEditDate] = useState<Date | undefined>(undefined);
  const [editHorario, setEditHorario] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [horariosEdit, setHorariosEdit] = useState<string[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [loadingHorarios, setLoadingHorarios] = useState(false);

  const activeCompany = companySlug;

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
    if (!editAppointment || !editDate || !activeCompany) return;
    setLoadingHorarios(true);
    clientFetchHorarios(format(editDate, "yyyy-MM-dd"), activeCompany)
      .then((horarios) => {
        setHorariosEdit(horarios);
        if (!horarios.includes(editHorario)) {
          setEditHorario("");
        }
      })
      .finally(() => setLoadingHorarios(false));
  }, [editAppointment, editDate, activeCompany]);

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

  const openEdit = (appointment: ClientAppointment) => {
    setEditAppointment(appointment);
    setEditServiceId(appointment.service_id?.toString() ?? "");
    setEditDate(parseISO(`${appointment.data}T00:00:00`));
    setEditHorario(appointment.horario);
    setEditNotes(appointment.observacoes ?? "");
  };

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editAppointment || !token || !activeCompany || !editDate || !editServiceId || !editHorario) {
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
          horario: editHorario,
          observacoes: editNotes.trim() || undefined,
        },
        token,
        activeCompany,
      );
      toast({
        title: "Agendamento atualizado",
        description: `${format(editDate, "dd/MM")} às ${editHorario}`,
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

  return (
    <div
      className="min-h-screen py-10 px-4"
      style={{
        background: `linear-gradient(180deg, ${clientPalette.background} 0%, ${clientPalette.surface} 60%, #ffffff 100%)`,
      }}
    >
      <div className="mx-auto max-w-4xl space-y-6">
        <Button variant="ghost" size="sm" className="inline-flex items-center gap-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>

        <Card className="border-border shadow-gold/40">
          <CardHeader>
            <CardTitle>Meus agendamentos</CardTitle>
            <CardDescription>
              {companyInfo?.nome
                ? `Reservas feitas na empresa ${companyInfo.nome}.`
                : "Acompanhe, reagende ou cancele seus horários confirmados."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => navigate("/cliente/agendar")}>
              <NotebookPen className="mr-2 h-4 w-4" />
              Novo agendamento
            </Button>
          </CardContent>
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
              <Select value={editHorario} onValueChange={setEditHorario} disabled={loadingHorarios}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingHorarios ? "Carregando..." : "Selecione um horário"} />
                </SelectTrigger>
                <SelectContent>
                  {horariosEdit.length === 0 && !loadingHorarios ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">Nenhum horário disponível</div>
                  ) : (
                    horariosEdit.map((hora) => (
                      <SelectItem key={hora} value={hora}>
                        {hora}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
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
    </div>
  );
}
  const canEdit = (appointment: ClientAppointment) => {
    if (appointment.status !== "confirmado") return false;
    const start = new Date(`${appointment.data}T${appointment.horario}:00`);
    const diffMinutes = (start.getTime() - Date.now()) / (1000 * 60);
    return diffMinutes >= 60;
  };
