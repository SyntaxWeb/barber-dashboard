import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  Clock,
  Scissors,
  NotebookPen,
  CheckCircle2,
  LogOut,
  ArrowRight,
  UserRound,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useClientAuth } from "@/contexts/ClientAuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  clientCreateAgendamento,
  clientFetchHorarios,
  clientFetchServicos,
} from "@/services/clientPortalService";
import { Servico } from "@/data/mockData";
import { cn } from "@/lib/utils";

export default function ClienteAgendamento() {
  const { client, token, logout, companySlug, setCompanySlug, companyInfo } = useClientAuth();
  const { palettes } = useTheme();
  const clientPalette = palettes.client;
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryCompany = searchParams.get("company");
  const activeCompany = queryCompany ?? companySlug ?? null;

  const [servicos, setServicos] = useState<Servico[]>([]);
  const [servicoId, setServicoId] = useState("");
  const [data, setData] = useState<Date | undefined>(new Date());
  const [horariosDisponiveis, setHorariosDisponiveis] = useState<string[]>([]);
  const [horario, setHorario] = useState("");
  const [observacoes, setObservacoes] = useState("");
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
    if (data && activeCompany) {
      const dataStr = format(data, "yyyy-MM-dd");
      clientFetchHorarios(dataStr, activeCompany)
        .then((horarios) => {
          setHorariosDisponiveis(horarios);
          if (!horarios.includes(horario)) {
            setHorario("");
          }
        })
        .catch(() => setHorariosDisponiveis([]));
    }
  }, [data, horario, activeCompany]);

  const servicoSelecionado = servicos.find((item) => item.id.toString() === servicoId);

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

    if (!servicoSelecionado || !data || !horario) {
      toast({
        title: "Preencha todos os campos",
        description: "Escolha serviço, data e horário disponíveis.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await clientCreateAgendamento(
        {
          service_id: servicoSelecionado.id,
          data: format(data, "yyyy-MM-dd"),
          horario,
          observacoes: observacoes.trim() || undefined,
        },
        token,
        activeCompany,
      );

      toast({
        title: "Agendamento confirmado!",
        description: `${servicoSelecionado.nome} em ${format(data, "dd/MM/yyyy")} às ${horario}`,
      });
      setServicoId("");
      setObservacoes("");
      setHorario("");
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

  if (!activeCompany) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center px-4 py-10">
        <Card className="max-w-md border-border shadow-gold">
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
      <div className="mx-auto max-w-3xl space-y-6">
        <Card className="border-border shadow-gold/50">
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Olá, {client?.name}</CardTitle>
              <CardDescription>
                Escolha o serviço e confirme seu horário disponível na empresa{" "}
                <span className="font-semibold text-foreground">
                  {companyInfo?.nome ?? activeCompany}
                </span>
                .
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate("/cliente/perfil")}>
                <UserRound className="mr-2 h-4 w-4" />
                Meu perfil
              </Button>
              <Button variant="ghost" size="sm" onClick={() => logout()}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Novo agendamento</CardTitle>
            <CardDescription>Verificamos automaticamente todos os horários livres.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label>Serviço</Label>
                <Select value={servicoId} onValueChange={setServicoId}>
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <Scissors className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Selecione um serviço" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {servicos.map((servico) => (
                      <SelectItem key={servico.id} value={servico.id.toString()}>
                        <div className="flex items-center justify-between gap-4">
                          <span>{servico.nome}</span>
                          <span className="text-primary font-medium">
                            {servico.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                  <Select value={horario} onValueChange={setHorario}>
                    <SelectTrigger>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Escolha o horário" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {horariosDisponiveis.length === 0 && (
                        <div className="px-3 py-2 text-sm text-muted-foreground">Nenhum horário livre</div>
                      )}
                      {horariosDisponiveis.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
      </div>
    </div>
  );
}
