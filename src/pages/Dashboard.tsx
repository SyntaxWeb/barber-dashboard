import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Calendar, Clock, Users, TrendingUp, Plus, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { Agendamento } from "@/data/mockData";
import { fetchAgendamentosPorData, formatarPreco } from "@/services/agendaService";

export default function Dashboard() {
  const [agendamentosHoje, setAgendamentosHoje] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);

  const hoje = format(new Date(), "yyyy-MM-dd");

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
      </div>
    </Layout>
  );
}
