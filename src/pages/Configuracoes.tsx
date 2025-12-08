import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Calendar, Scissors, Plus, Trash2, Save } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Layout } from "@/components/layout/Layout";
import { Servico, ConfiguracoesBarbearia } from "@/data/mockData";
import {
  fetchServicos,
  fetchConfiguracoes,
  updateConfiguracoes,
  createServico,
  deleteServico,
  formatarPreco,
} from "@/services/agendaService";
import { useToast } from "@/hooks/use-toast";

export default function Configuracoes() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [servicos, setServicos] = useState<Servico[]>([]);
  const [configuracoes, setConfiguracoes] = useState<ConfiguracoesBarbearia | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [horarioInicio, setHorarioInicio] = useState("09:00");
  const [horarioFim, setHorarioFim] = useState("19:00");
  const [intervalo, setIntervalo] = useState("30");
  const [diasBloqueados, setDiasBloqueados] = useState<Date[]>([]);

  // Novo serviço
  const [novoServicoNome, setNovoServicoNome] = useState("");
  const [novoServicoPreco, setNovoServicoPreco] = useState("");
  const [novoServicoDuracao, setNovoServicoDuracao] = useState("30");

  useEffect(() => {
    async function loadData() {
      try {
        const [servicosData, configData] = await Promise.all([fetchServicos(), fetchConfiguracoes()]);
        setServicos(servicosData);
        setConfiguracoes(configData);
        setHorarioInicio(configData.horarioInicio);
        setHorarioFim(configData.horarioFim);
        setIntervalo(configData.intervaloMinutos.toString());
        setDiasBloqueados(configData.diasBloqueados.map((d) => new Date(d + "T12:00:00")));
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSaveHorarios = async () => {
    setSaving(true);
    try {
      await updateConfiguracoes({
        horarioInicio,
        horarioFim,
        intervaloMinutos: parseInt(intervalo),
        diasBloqueados: diasBloqueados.map((d) => format(d, "yyyy-MM-dd")),
      });
      toast({
        title: "Configurações salvas",
        description: "Os horários de trabalho foram atualizados.",
      });
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddServico = async () => {
    if (!novoServicoNome.trim() || !novoServicoPreco) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o nome e preço do serviço.",
        variant: "destructive",
      });
      return;
    }

    try {
      const novoServico = await createServico({
        nome: novoServicoNome.trim(),
        preco: parseFloat(novoServicoPreco),
        duracao: parseInt(novoServicoDuracao),
      });
      setServicos([...servicos, novoServico]);
      setNovoServicoNome("");
      setNovoServicoPreco("");
      setNovoServicoDuracao("30");
      toast({
        title: "Serviço adicionado",
        description: `${novoServico.nome} foi adicionado à lista.`,
      });
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o serviço.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteServico = async (id: number) => {
    try {
      await deleteServico(id);
      setServicos(servicos.filter((s) => s.id !== id));
      toast({
        title: "Serviço removido",
        description: "O serviço foi removido da lista.",
      });
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível remover o serviço.",
        variant: "destructive",
      });
    }
  };

  const horarios = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, "0")}:00`);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Configurações</h1>
            <p className="text-muted-foreground">Gerencie horários e serviços</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Horários de Trabalho */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Horários de Trabalho
              </CardTitle>
              <CardDescription>Defina o horário de funcionamento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Início</Label>
                  <Select value={horarioInicio} onValueChange={setHorarioInicio}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {horarios.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fim</Label>
                  <Select value={horarioFim} onValueChange={setHorarioFim}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {horarios.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Intervalo entre agendamentos</Label>
                <Select value={intervalo} onValueChange={setIntervalo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutos</SelectItem>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="45">45 minutos</SelectItem>
                    <SelectItem value="60">1 hora</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSaveHorarios} className="w-full" disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Salvando..." : "Salvar Horários"}
              </Button>
            </CardContent>
          </Card>

          {/* Dias Bloqueados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Dias Bloqueados
              </CardTitle>
              <CardDescription>Férias, folgas e feriados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Dia Bloqueado
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="multiple"
                    selected={diasBloqueados}
                    onSelect={(dates) => setDiasBloqueados(dates || [])}
                    locale={ptBR}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              <div className="flex flex-wrap gap-2">
                {diasBloqueados.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum dia bloqueado</p>
                ) : (
                  diasBloqueados.map((dia, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => setDiasBloqueados(diasBloqueados.filter((_, i) => i !== index))}
                    >
                      {format(dia, "dd/MM/yyyy")}
                      <Trash2 className="h-3 w-3 ml-1" />
                    </Badge>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Serviços */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scissors className="h-5 w-5 text-primary" />
              Serviços
            </CardTitle>
            <CardDescription>Gerencie os serviços oferecidos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Adicionar Serviço */}
            <div className="flex flex-col sm:flex-row gap-4 p-4 border border-dashed border-border rounded-lg">
              <div className="flex-1">
                <Input
                  placeholder="Nome do serviço"
                  value={novoServicoNome}
                  onChange={(e) => setNovoServicoNome(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-32">
                <Input
                  type="number"
                  placeholder="Preço"
                  value={novoServicoPreco}
                  onChange={(e) => setNovoServicoPreco(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-32">
                <Select value={novoServicoDuracao} onValueChange={setNovoServicoDuracao}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 min</SelectItem>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="45">45 min</SelectItem>
                    <SelectItem value="60">60 min</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddServico}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>

            {/* Lista de Serviços */}
            <div className="space-y-2">
              {servicos.map((servico) => (
                <div
                  key={servico.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Scissors className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{servico.nome}</p>
                      <p className="text-sm text-muted-foreground">{servico.duracao} minutos</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-primary">{formatarPreco(servico.preco)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteServico(servico.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
