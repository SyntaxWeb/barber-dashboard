import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchCompanyReport, CompanyReport } from "@/services/reportService";
import { formatarPreco } from "@/services/agendaService";
import { AlertTriangle, BarChart3, TrendingUp, Users2, RefreshCcw, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Relatorios() {
  const [report, setReport] = useState<CompanyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCompanyReport();
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar o relatório.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const trendMax = useMemo(() => {
    if (!report?.trend?.length) return 0;
    return Math.max(...report.trend.map((item) => item.total));
  }, [report?.trend]);

  return (
    <Layout>
      <div className="space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Relatórios</h1>
            <p className="text-muted-foreground">
              Visão consolidada da empresa e frequência de clientes dos últimos 30 dias.
            </p>
          </div>
          <Button variant="outline" onClick={loadReport} className="gap-2" disabled={loading}>
            <RefreshCcw className="h-4 w-4" />
            Atualizar
          </Button>
        </header>

        {error && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="flex items-center gap-3 py-4 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <p>{error}</p>
            </CardContent>
          </Card>
        )}

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Agendamentos totais"
            value={loading ? "..." : report?.summary.total_appointments ?? "--"}
            icon={<BarChart3 className="h-5 w-5 text-primary" />}
          />
          <SummaryCard
            title="Confirmados"
            value={loading ? "..." : report?.summary.confirmed ?? "--"}
            description="No pipeline"
          />
          <SummaryCard
            title="Concluídos"
            value={loading ? "..." : report?.summary.completed ?? "--"}
            description="Histórico geral"
          />
          <SummaryCard
            title="Receita do mês"
            value={loading ? "..." : formatarPreco(report?.summary.revenue_month ?? 0)}
            icon={<TrendingUp className="h-5 w-5 text-primary" />}
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5 text-primary" />
                Volume de agendamentos (30 dias)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : report?.trend.length ? (
                <div className="space-y-3">
                  {report.trend.map((item) => (
                    <div key={item.date}>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{new Date(item.date).toLocaleDateString("pt-BR", { month: "short", day: "numeric" })}</span>
                        <span>{item.total} atend.</span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-primary transition-all"
                          style={{ width: trendMax ? `${(item.total / trendMax) * 100}%` : "0%" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum dado recente para exibir.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users2 className="h-5 w-5 text-primary" />
                Feedback
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-4xl font-bold text-primary">
                  {loading ? "--" : report?.feedback.average?.toFixed(1) ?? "--"}
                </p>
                <p className="text-sm text-muted-foreground">Média geral</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Respostas recebidas</span>
                  <Badge variant="secondary">{report?.feedback.responses ?? 0}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Aguardando resposta</span>
                  <Badge variant="outline">{report?.feedback.pending ?? 0}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  As notas são calculadas considerando serviço, profissional e sistema de agendamento.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Frequência por cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : report?.top_clients.length ? (
                report.top_clients.map((client) => (
                  <div key={`${client.cliente}-${client.telefone}`} className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{client.cliente}</p>
                      <p className="text-xs text-muted-foreground">
                        {client.telefone || "sem telefone"} • Última visita:{" "}
                        {client.last_visit
                          ? new Date(client.last_visit).toLocaleDateString("pt-BR")
                          : "não informado"}
                      </p>
                    </div>
                    <Badge variant="secondary">{client.total} visitas</Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Sem registros suficientes.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Desempenho por serviço</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : report?.services.length ? (
                report.services.map((service) => (
                  <div key={service.service_id ?? service.servico} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{service.servico}</span>
                      <span className="text-muted-foreground">{service.total} atendimentos</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Receita estimada:{" "}
                      <span className="font-semibold">{formatarPreco(service.revenue ?? 0)}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted">
                      <div
                        className="h-1.5 rounded-full bg-primary/70"
                        style={{
                          width: `${
                            report.services[0]?.total ? (service.total / report.services[0].total) * 100 : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum serviço encontrado.</p>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </Layout>
  );
}

interface SummaryCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
}

const SummaryCard = ({ title, value, description, icon }: SummaryCardProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold text-foreground">{value}</div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </CardContent>
  </Card>
);
