import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  Clock,
  Scissors,
  NotebookPen,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useClientAuth } from "@/contexts/ClientAuthContext";
import { clientCreateAgendamento, clientFetchHorarios, clientFetchServicos } from "@/services/clientPortalService";
import { fetchClientLoyalty } from "@/services/clientLoyaltyService";
import { Servico } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { ClientPortalLayout } from "@/components/layout/ClientPortalLayout";
import { AvailabilityData, joinHorario } from "@/lib/availability";

export default function ClienteAgendamento() {
  const { client, token, companySlug, setCompanySlug, companyInfo } = useClientAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryCompany = searchParams.get("company");
  const activeCompany = queryCompany ?? companySlug ?? null;

  const [servicos, setServicos] = useState<Servico[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
  const [data, setData] = useState<Date | undefined>(new Date());
  const [availability, setAvailability] = useState<AvailabilityData>({
    horarios: [],
    horas: [],
    minutosPorHora: {},
  });
  const [hora, setHora] = useState("");
  const [minuto, setMinuto] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [loyaltyRedemptionId, setLoyaltyRedemptionId] = useState("none");
  const [pendingRedemptions, setPendingRedemptions] = useState<Array<{
    id: number;
    reward: {
      id: number;
      name: string;
      points_cost: number;
      grants_free_appointment?: boolean;
    };
  }>>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (queryCompany && queryCompany !== companySlug) {
      setCompanySlug(queryCompany);
    }
  }, [queryCompany, companySlug, setCompanySlug]);

  useEffect(() => {
    if (!activeCompany) return;
    clientFetchServicos(activeCompany)
      .then(setServicos)
      .catch(() => toast({ title: "Erro ao carregar serviços", variant: "destructive" }));
  }, [activeCompany, toast]);

  useEffect(() => {
    if (!data || !activeCompany || selectedServiceIds.length === 0) {
      setAvailability({ horarios: [], horas: [], minutosPorHora: {} });
      setHora("");
      setMinuto("");
      return;
    }
    const dataStr = format(data, "yyyy-MM-dd");
    clientFetchHorarios(dataStr, activeCompany, selectedServiceIds[0], undefined, selectedServiceIds)
      .then((dataResponse) => {
        setAvailability(dataResponse);
      })
      .catch(() => setAvailability({ horarios: [], horas: [], minutosPorHora: {} }));
  }, [data, activeCompany, selectedServiceIds]);

  useEffect(() => {
    if (!hora) {
      if (minuto) setMinuto("");
      return;
    }
    if (!availability.horas.includes(hora)) {
      setHora("");
      setMinuto("");
      return;
    }
    const minutosDisponiveis = availability.minutosPorHora[hora] ?? [];
    if (!minutosDisponiveis.includes(minuto) && minuto) {
      setMinuto("");
    }
  }, [availability, hora, minuto]);

  useEffect(() => {
    if (!token) {
      setPendingRedemptions([]);
      setLoyaltyRedemptionId("none");
      return;
    }

    fetchClientLoyalty()
      .then((summary) => {
        const pending = (summary.pending_redemptions ?? []).filter((item) => item.reward?.grants_free_appointment);
        setPendingRedemptions(
          pending.map((item) => ({
            id: item.id,
            reward: {
              id: item.reward.id,
              name: item.reward.name,
              points_cost: item.reward.points_cost,
              grants_free_appointment: item.reward.grants_free_appointment,
            },
          })),
        );
      })
      .catch(() => setPendingRedemptions([]));
  }, [token]);

  const servicosSelecionados = servicos.filter((item) => selectedServiceIds.includes(item.id));
  const horarioSelecionado = joinHorario(hora, minuto);
  const minutosDisponiveis = hora ? availability.minutosPorHora[hora] ?? [] : [];
  const selectedPendingRedemption = pendingRedemptions.find((item) => item.id.toString() === loyaltyRedemptionId);
  const totalPrecoSelecionado = servicosSelecionados.reduce((total, servico) => total + servico.preco, 0);
  const totalDuracaoSelecionada = servicosSelecionados.reduce((total, servico) => total + servico.duracao, 0);


  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!token) {
      toast({ title: "Faça login novamente", variant: "destructive" });
      navigate("/cliente/login");
      return;
    }

    if (!activeCompany) {
      toast({
        title: "Empresa não definida",
        description: "Utilize o link exclusivo da empresa para criar um agendamento.",
        variant: "destructive",
      });
      return;
    }

    if (servicosSelecionados.length === 0 || !data || !horarioSelecionado) {
      toast({
        title: "Preencha todos os campos",
        description: "Escolha ao menos um serviço, data e horário disponíveis.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await clientCreateAgendamento(
        {
          service_id: selectedServiceIds[0],
          service_ids: selectedServiceIds,
          data: format(data, "yyyy-MM-dd"),
          horario: horarioSelecionado,
          observacoes: observacoes.trim() || undefined,
          loyalty_redemption_id: loyaltyRedemptionId !== "none" ? Number(loyaltyRedemptionId) : undefined,
        },
        token,
        activeCompany,
      );

      toast({
        title: "Agendamento confirmado!",
        description: `${servicosSelecionados.map((servico) => servico.nome).join(" + ")} em ${format(data, "dd/MM/yyyy")} às ${horarioSelecionado}`,
      });
      setSelectedServiceIds([]);
      setObservacoes("");
      setHora("");
      setMinuto("");
      setLoyaltyRedemptionId("none");
      setPendingRedemptions((prev) => prev.filter((item) => item.id.toString() !== loyaltyRedemptionId));
    } catch (error) {
      toast({
        title: "Horário indisponível",
        description: error instanceof Error ? error.message : "Tente outro horário.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const content = !activeCompany ? (
    <Card className="border-border shadow-gold">
      <CardHeader>
        <CardTitle>Escolha uma empresa</CardTitle>
        <CardDescription>
          Acesse este portal usando um link exclusivo do estabelecimento para visualizar horários disponíveis.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>Peça ao profissional o link do tipo `https://seu-dominio.com/e/&lt;empresa&gt;/agendar`.</p>
        <p>
          Ao abrir esse link, o parâmetro `company` será preenchido automaticamente e você poderá prosseguir com o
          agendamento.
        </p>
      </CardContent>
    </Card>
  ) : (
    <>
      <Card className="border-border shadow-gold/50 mb-3">
        <CardHeader>
          <CardTitle className="text-xl">Olá, {client?.name}</CardTitle>
          <CardDescription>
            Escolha o serviço e confirme seu horário disponível na empresa{" "}
            <span className="font-semibold text-foreground">{companyInfo?.nome ?? activeCompany}</span>.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="mb-3">
          <CardHeader>
            <CardTitle>Novo agendamento</CardTitle>
            <CardDescription>Verificamos automaticamente todos os horários livres.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label>Serviços</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between font-normal">
                      <span className="flex items-center gap-2 truncate">
                        <Scissors className="h-4 w-4 text-muted-foreground" />
                        {servicosSelecionados.length > 0
                          ? servicosSelecionados.map((servico) => servico.nome).join(", ")
                          : "Selecione um ou mais serviços"}
                      </span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2" align="start">
                    <div className="space-y-1">
                      {servicos.map((servico) => {
                        const selected = selectedServiceIds.includes(servico.id);
                        return (
                          <button
                            key={servico.id}
                            type="button"
                            onClick={() =>
                              setSelectedServiceIds((prev) =>
                                prev.includes(servico.id)
                                  ? prev.filter((id) => id !== servico.id)
                                  : [...prev, servico.id],
                              )
                            }
                            className="flex w-full items-start justify-between gap-3 rounded-lg px-3 py-2 text-left hover:bg-muted"
                          >
                            <div className="flex min-w-0 items-start gap-3">
                              <Checkbox checked={selected} className="mt-0.5" />
                              <div className="min-w-0">
                                <p className="font-medium text-foreground">{servico.nome}</p>
                                <p className="text-xs text-muted-foreground">{servico.duracao} min</p>
                              </div>
                            </div>
                            <span className="shrink-0 text-sm font-medium text-primary">
                              {servico.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
                {servicosSelecionados.length > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {servicosSelecionados.length} serviço(s) selecionado(s).
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">Escolha um ou mais serviços para calcular o tempo total.</p>
                )}
              </div>

              {pendingRedemptions.length > 0 ? (
                <div className="space-y-2">
                  <Label>Usar recompensa</Label>
                  <Select value={loyaltyRedemptionId} onValueChange={setLoyaltyRedemptionId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma recompensa de agendamento gratis" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nao usar recompensa agora</SelectItem>
                      {pendingRedemptions.map((item) => (
                        <SelectItem key={item.id} value={item.id.toString()}>
                          {item.reward.name} - horario gratis
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedPendingRedemption ? (
                    <p className="text-sm text-emerald-700">
                      Esta recompensa sera aplicada neste agendamento e o valor do servico ficara zerado.
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Se preferir, voce pode guardar sua recompensa para usar em outro horario.
                    </p>
                  )}
                </div>
              ) : null}

              <div className="flex flex-col gap-4 md:flex-row">
                <div className="flex-1 space-y-2">
                  <Label>Data</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !data && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {data ? format(data, "dd 'de' MMMM", { locale: ptBR }) : "Escolha uma data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={data} onSelect={setData} locale={ptBR} disabled={{ before: new Date() }} />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex-1 space-y-2">
                  <Label>Horário</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={hora}
                      onValueChange={(value) => {
                        setHora(value);
                        setMinuto("");
                      }}
                      disabled={!data || selectedServiceIds.length === 0}
                    >
                      <SelectTrigger>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <SelectValue placeholder="Hora" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {selectedServiceIds.length === 0 && (
                          <div className="px-3 py-2 text-sm text-muted-foreground">Selecione ao menos um serviço primeiro</div>
                        )}
                        {selectedServiceIds.length > 0 && availability.horas.length === 0 && (
                          <div className="px-3 py-2 text-sm text-muted-foreground">Nenhuma hora livre</div>
                        )}
                        {availability.horas.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={minuto} onValueChange={setMinuto} disabled={!hora}>
                      <SelectTrigger>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <SelectValue placeholder="Minuto" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {!hora && (
                          <div className="px-3 py-2 text-sm text-muted-foreground">Selecione uma hora</div>
                        )}
                        {hora && minutosDisponiveis.length === 0 && (
                          <div className="px-3 py-2 text-sm text-muted-foreground">Nenhum minuto livre</div>
                        )}
                        {minutosDisponiveis.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <div className="relative">
                  <NotebookPen className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    id="observacoes"
                    placeholder="Preferências, alergias, materiais, etc."
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    className="pl-9"
                    rows={4}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Resumo do agendamento</p>
                <p>
                  {servicosSelecionados.length > 0
                    ? servicosSelecionados.map((servico) => servico.nome).join(" + ")
                    : "Escolha um ou mais serviços"}
                </p>
                <p>{data ? format(data, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "Escolha uma data"}</p>
                <p>{horarioSelecionado || "Escolha um horário"}</p>
                <p>{servicosSelecionados.length > 0 ? `Duração total: ${totalDuracaoSelecionada} min` : "A duração total aparecerá aqui"}</p>
                <p className="mt-2 font-medium text-foreground">
                  {servicosSelecionados.length > 0
                    ? selectedPendingRedemption
                      ? "Valor final: gratis"
                      : `Valor: ${totalPrecoSelecionado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`
                    : "Valor do serviço será exibido aqui"}
                </p>
              </div>

              <Button type="submit" className="w-full shadow-gold" disabled={loading}>
                {loading ? (
                  "Confirmando..."
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Confirmar agendamento
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
      </Card>

      <Card>
          <CardHeader>
            <CardTitle>Dicas rápidas</CardTitle>
            <CardDescription>Melhore sua experiência no SyntaxAtendimento</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
              Prefira horários fora do pico para ter ainda mais flexibilidade.
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
              Use o campo de observações para informar preferências ou restrições.
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
              Precisa remarcar? Entre em contato com o profissional e escolha outro horário disponível.
            </div>
          </CardContent>
      </Card>
    </>
  );

  return <ClientPortalLayout>{content}</ClientPortalLayout>;
}
