import { useEffect, useState, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Calendar, Scissors, Plus, Trash2, Save, Building2, Upload, Link2, Download } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { fetchEmpresa, updateEmpresa, type EmpresaInfo } from "@/services/companyService";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function Configuracoes() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updateCompany } = useAuth();

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

  // Empresa
  const [empresa, setEmpresa] = useState<EmpresaInfo | null>(null);
  const [empresaNome, setEmpresaNome] = useState("");
  const [empresaDescricao, setEmpresaDescricao] = useState("");
  const [iconePreview, setIconePreview] = useState<string | null>(null);
  const [iconeFile, setIconeFile] = useState<File | null>(null);
  const [iconeTempUrl, setIconeTempUrl] = useState<string | null>(null);
  const [salvandoEmpresa, setSalvandoEmpresa] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [servicosData, configData, empresaData] = await Promise.all([
          fetchServicos(),
          fetchConfiguracoes(),
          fetchEmpresa(),
        ]);
        setServicos(servicosData);
        setConfiguracoes(configData);
        setHorarioInicio(configData.horarioInicio);
        setHorarioFim(configData.horarioFim);
        setIntervalo(configData.intervaloMinutos.toString());
        setDiasBloqueados(configData.diasBloqueados.map((d) => new Date(d + "T12:00:00")));
        setEmpresa(empresaData);
        setEmpresaNome(empresaData.nome);
        setEmpresaDescricao(empresaData.descricao ?? "");
        setIconePreview(empresaData.icon_url ?? null);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    return () => {
      if (iconeTempUrl) {
        URL.revokeObjectURL(iconeTempUrl);
      }
    };
  }, [iconeTempUrl]);

  const handleIconChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setIconeFile(file);
    if (iconeTempUrl) {
      URL.revokeObjectURL(iconeTempUrl);
      setIconeTempUrl(null);
    }

    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setIconeTempUrl(previewUrl);
      setIconePreview(previewUrl);
    } else {
      setIconePreview(empresa?.icon_url ?? null);
    }
  };

  const handleSaveEmpresa = async () => {
    if (!empresaNome.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Informe o nome que será exibido para os clientes.",
        variant: "destructive",
      });
      return;
    }

    setSalvandoEmpresa(true);
    try {
      const atualizada = await updateEmpresa({
        nome: empresaNome.trim(),
        descricao: empresaDescricao.trim(),
        icone: iconeFile ?? undefined,
      });
      setEmpresa(atualizada);
      setIconePreview(atualizada.icon_url ?? null);
      if (iconeTempUrl) {
        URL.revokeObjectURL(iconeTempUrl);
        setIconeTempUrl(null);
      }
      setIconeFile(null);
      updateCompany(atualizada);
      toast({
        title: "Empresa atualizada",
        description: "Os dados públicos foram salvos.",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar empresa",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSalvandoEmpresa(false);
    }
  };

  const handleCopyLink = async () => {
    if (!empresa?.agendamento_url) return;
    try {
      await navigator.clipboard.writeText(empresa.agendamento_url);
      toast({
        title: "Link copiado",
        description: "Compartilhe com clientes para que agendem online.",
      });
    } catch {
      toast({
        title: "Não foi possível copiar",
        description: "Copie manualmente o link abaixo.",
        variant: "destructive",
      });
    }
  };

  const qrCodeUrl = empresa?.agendamento_url
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(empresa.agendamento_url)}`
    : null;

  const handleDownloadQrCode = async () => {
    if (!qrCodeUrl) return;
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `qrcode-${empresa?.slug ?? "empresa"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      toast({
        title: "Não foi possível baixar",
        description: "Abra o QR Code em outra aba para salvar manualmente.",
        variant: "destructive",
      });
    }
  };

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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Identidade da empresa
            </CardTitle>
            <CardDescription>Atualize o que seus clientes veem ao acessar o link público.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative h-20 w-20 rounded-full border border-dashed border-border bg-muted flex items-center justify-center overflow-hidden">
                {iconePreview ? (
                  <img src={iconePreview} alt="Ícone da empresa" className="h-full w-full object-cover" />
                ) : (
                  <Scissors className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="space-y-2">
                <input id="iconeUpload" type="file" accept="image/*" className="hidden" onChange={handleIconChange} />
                <Label
                  htmlFor="iconeUpload"
                  className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-primary"
                >
                  <Upload className="h-4 w-4" />
                  {iconePreview ? "Trocar ícone" : "Adicionar ícone"}
                </Label>
                <p className="text-xs text-muted-foreground">PNG ou JPG até 2MB.</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nome da empresa</Label>
              <Input value={empresaNome} onChange={(e) => setEmpresaNome(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Descrição curta</Label>
              <Textarea
                value={empresaDescricao}
                onChange={(e) => setEmpresaDescricao(e.target.value)}
                placeholder="Conte rapidamente o que torna seu atendimento especial."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Link público de agendamento</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input readOnly value={empresa?.agendamento_url ?? "Link indisponível"} className="sm:flex-1" />
                <div className="flex gap-2 sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCopyLink}
                    disabled={!empresa?.agendamento_url}
                  >
                    <Link2 className="h-4 w-4 mr-2" />
                    Copiar
                  </Button>
                  <Button type="button" variant="outline" onClick={handleDownloadQrCode} disabled={!qrCodeUrl}>
                    <Download className="h-4 w-4 mr-2" />
                    QR Code
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Use este link nas redes sociais, WhatsApp ou imprima o QR Code no seu estabelecimento.
              </p>
            </div>

            {qrCodeUrl && (
              <div className="mt-4 flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-4">
                <div className="text-sm font-semibold text-muted-foreground">QR Code da empresa</div>
                <div className="rounded-lg bg-white p-4">
                  <img src={qrCodeUrl} alt="QR Code da empresa" className="h-48 w-48" />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Imprima e deixe no balcão ou compartilhe digitalmente para seus clientes acessarem a agenda.
                </p>
              </div>
            )}

            <Button type="button" className="shadow-gold" onClick={handleSaveEmpresa} disabled={salvandoEmpresa}>
              {salvandoEmpresa ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Salvando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Salvar informações
                </span>
              )}
            </Button>
          </CardContent>
        </Card>

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
