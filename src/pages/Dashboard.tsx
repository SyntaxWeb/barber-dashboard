import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Calendar, Clock, Users, TrendingUp, Plus, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Layout } from "@/components/layout/Layout";
import { Agendamento } from "@/data/mockData";
import { fetchAgendamentosPorData, formatarPreco } from "@/services/agendaService";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import defaultLogo from "@/assets/syntax-logo.svg";

export default function Dashboard() {
  const [agendamentosHoje, setAgendamentosHoje] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const company = user?.company;
  const companyIcon = company?.icon_url ?? defaultLogo;
  const galleryPhotos = Array.isArray(company?.gallery_photos) ? company.gallery_photos : [];
  const agendaLink = company?.agendamento_url ?? "";
  const notifyEmail = company?.notify_via_email && company?.notify_email ? company.notify_email : null;
  const notifyTelegram = company?.notify_via_telegram && company?.notify_telegram ? company.notify_telegram : null;

  const hoje = format(new Date(), "yyyy-MM-dd");

  const handleCopyAgendaLink = async () => {
    if (!agendaLink) return;
    try {
      await navigator.clipboard.writeText(agendaLink);
      toast({
        title: "Link copiado",
        description: "Compartilhe com os clientes para aumentar os retornos.",
      });
    } catch {
      toast({
        title: "Nao foi possivel copiar",
        description: "Copie o endereco manualmente.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchAgendamentosPorData(hoje);
        setAgendamentosHoje(data);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [hoje]);

  const agendamentosConfirmados = agendamentosHoje.filter(a => a.status === 'confirmado');
  const agendamentosConcluidos = agendamentosHoje.filter(a => a.status === 'concluido');
  const proximoCliente = agendamentosConfirmados
    .sort((a, b) => a.horario.localeCompare(b.horario))[0];

  const faturamentoHoje = agendamentosConcluidos.reduce((acc, a) => acc + a.preco, 0);
  const horariosLivres = 20 - agendamentosHoje.filter(a => a.status !== 'cancelado').length;

  const stats = [
    {
      title: 'Agendamentos Hoje',
      value: agendamentosConfirmados.length + agendamentosConcluidos.length,
      icon: Calendar,
      description: `${agendamentosConcluidos.length} concluídos`
    },
    {
      title: 'Horários Livres',
      value: horariosLivres,
      icon: Clock,
      description: 'Disponíveis hoje'
    },
    {
      title: 'Clientes Atendidos',
      value: agendamentosConcluidos.length,
      icon: Users,
      description: 'Hoje'
    },
    {
      title: 'Faturamento',
      value: formatarPreco(faturamentoHoje),
      icon: TrendingUp,
      description: 'Hoje',
      isHighlight: true
    }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              {new Date().toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })}
            </p>
          </div>
          <Button asChild className="shadow-gold">
            <Link to="/novo-agendamento">
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Link>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title} className={stat.isHighlight ? 'border-primary shadow-gold' : ''}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.isHighlight ? 'text-primary' : 'text-muted-foreground'}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stat.isHighlight ? 'text-primary' : ''}`}>
                  {loading ? '...' : stat.value}
                </div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Próximo Cliente Card */}
        {proximoCliente && (
          <Card className="border-primary/50 bg-gradient-to-r from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Próximo Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20">
                    <span className="text-xl font-bold text-primary">
                      {proximoCliente.cliente.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-xl font-bold">{proximoCliente.cliente}</p>
                    <p className="text-muted-foreground">{proximoCliente.servico}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-primary">{proximoCliente.horario}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatarPreco(proximoCliente.preco)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="group cursor-pointer transition-all hover:shadow-gold hover:border-primary/50">
            <Link to="/agenda">
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Ver Agenda</h3>
                    <p className="text-sm text-muted-foreground">
                      Visualizar todos os agendamentos
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardContent>
            </Link>
          </Card>

          <Card className="group cursor-pointer transition-all hover:shadow-gold hover:border-primary/50">
            <Link to="/clientes">
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Cadastrar cliente</h3>
                    <p className="text-sm text-muted-foreground">
                      Centralize dados e contatos
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardContent>
            </Link>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Informacoes da barbearia</CardTitle>
              <CardDescription>Tudo que aparece para os clientes nos links publicos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted shadow-inner overflow-hidden">
                  <img src={companyIcon} alt={company?.nome ?? "Barbearia"} className="h-full w-full object-cover" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{company?.nome ?? "Configure sua barbearia"}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    {company?.slug && <Badge variant="secondary">/{company.slug}</Badge>}
                    {company?.subscription_plan && (
                      <Badge className="bg-primary/10 text-primary">
                        Plano {company.subscription_plan}
                      </Badge>
                    )}
                    {company?.subscription_status && (
                      <Badge variant="outline" className="text-xs">
                        Status {company.subscription_status}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                {company?.descricao
                  ? company.descricao
                  : "Conte seu diferencial nas configuracoes para reforcar o posicionamento da barbearia."}
              </p>

              <div className="space-y-3 text-sm">
                <div className="rounded-xl border border-border/70 p-3">
                  <p className="text-xs uppercase text-muted-foreground">Agenda publica</p>
                  {agendaLink ? (
                    <>
                      <p className="mt-1 break-all font-semibold text-foreground">{agendaLink}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button variant="secondary" size="sm" onClick={handleCopyAgendaLink}>
                          Copiar link
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <a href={agendaLink} target="_blank" rel="noreferrer">
                            Abrir
                          </a>
                        </Button>
                      </div>
                    </>
                  ) : (
                    <p className="mt-1 text-muted-foreground">
                      Gere seu link publico em Configuracoes &gt; Empresa.
                    </p>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border/70 p-3">
                    <p className="text-xs uppercase text-muted-foreground">Alertas por email</p>
                    <p className="mt-1 font-semibold text-foreground">{notifyEmail ?? "Sem email definido"}</p>
                    <p className="text-xs text-muted-foreground">
                      {company?.notify_via_email ? "Ativo" : "Desativado"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/70 p-3">
                    <p className="text-xs uppercase text-muted-foreground">Alertas no Telegram</p>
                    <p className="mt-1 font-semibold text-foreground">{notifyTelegram ?? "Sem chat conectado"}</p>
                    <p className="text-xs text-muted-foreground">
                      {company?.notify_via_telegram ? "Ativo" : "Desativado"}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Ajuste essas informacoes no menu{" "}
                <Link to="/configuracoes" className="font-semibold text-primary hover:underline">
                  Configuracoes
                </Link>
                .
              </p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Galeria da barbearia</CardTitle>
              <CardDescription>Use imagens reais para reforcar o estilo do seu espaco.</CardDescription>
            </CardHeader>
            <CardContent>
              {galleryPhotos.length ? (
                <div className="space-y-3">
                  <Carousel opts={{ loop: true }}>
                    <CarouselContent>
                      {galleryPhotos.map((photo, index) => (
                        <CarouselItem key={`${photo}-${index}`}>
                          <div className="relative h-60 w-full overflow-hidden rounded-2xl border border-border/60 bg-muted">
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
                    Atualize as fotos em Configuracoes &gt; Empresa para manter o feed sempre atual.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-border/70 p-6 text-sm text-muted-foreground">
                  <p>Ainda nao ha fotos cadastradas. Mostre o clima do espaco para aumentar a confianca.</p>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/configuracoes">Adicionar fotos</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
