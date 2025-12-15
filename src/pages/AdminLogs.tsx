import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchActivityLogs, ActivityLog } from "@/services/adminService";
import { Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PER_PAGE = 20;

export default function AdminLogs() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<{ current_page: number; last_page: number; total: number }>({
    current_page: 1,
    last_page: 1,
    total: 0,
  });
  const [filters, setFilters] = useState({ company_id: "", user_id: "", action: "" });
  const [form, setForm] = useState(filters);

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetchActivityLogs({
        page,
        per_page: PER_PAGE,
        company_id: filters.company_id || undefined,
        user_id: filters.user_id || undefined,
        action: filters.action || undefined,
      });
      setLogs(response.data);
      setMeta({
        current_page: response.meta.current_page,
        last_page: response.meta.last_page,
        total: response.meta.total,
      });
    } catch (error) {
      toast({
        title: "Erro ao carregar logs",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters]);

  const formatDate = (value?: string) => {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("pt-BR");
  };

  const detailsLabel = (record: ActivityLog) => {
    if (!record.details) return "--";
    return JSON.stringify(record.details, null, 2);
  };

  const hasPrev = page > 1;
  const hasNext = page < meta.last_page;

  const appliedFiltersCount = useMemo(() => {
    return Object.values(filters).filter((value) => value).length;
  }, [filters]);

  const handleApplyFilters = (event: React.FormEvent) => {
    event.preventDefault();
    setFilters(form);
    setPage(1);
  };

  const handleClearFilters = () => {
    setForm({ company_id: "", user_id: "", action: "" });
    setFilters({ company_id: "", user_id: "", action: "" });
    setPage(1);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Logs e Auditoria</CardTitle>
              <p className="text-sm text-muted-foreground">
                Apenas superadmin acessa. Use filtros para localizar ações específicas realizadas pelos prestadores.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Atualizar
              {appliedFiltersCount > 0 && <Badge variant="secondary">{appliedFiltersCount}</Badge>}
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleApplyFilters} className="grid gap-4 md:grid-cols-4">
              <div>
                <label className="text-sm text-muted-foreground block mb-1">ID da empresa</label>
                <Input
                  value={form.company_id}
                  onChange={(event) => setForm((prev) => ({ ...prev, company_id: event.target.value }))}
                  placeholder="Ex.: 12"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">ID do usuário</label>
                <Input
                  value={form.user_id}
                  onChange={(event) => setForm((prev) => ({ ...prev, user_id: event.target.value }))}
                  placeholder="Ex.: 55"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Ação</label>
                <Input
                  value={form.action}
                  onChange={(event) => setForm((prev) => ({ ...prev, action: event.target.value }))}
                  placeholder="Ex.: appointment.created"
                />
              </div>
              <div className="flex items-end gap-2">
                <Button type="submit" className="flex-1">
                  Aplicar
                </Button>
                <Button type="button" variant="ghost" onClick={handleClearFilters}>
                  Limpar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Registros ({meta.total}) {loading && <Loader2 className="ml-2 inline h-4 w-4 animate-spin" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">Nenhum log encontrado.</p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Detalhes</TableHead>
                      <TableHead>IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium whitespace-nowrap">{formatDate(log.created_at)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.action}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{log.user?.name ?? "--"}</span>
                            <span className="text-xs text-muted-foreground">
                              ID #{log.user?.id ?? "--"} · {log.user?.email ?? "--"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{log.company?.nome ?? "--"}</span>
                            <span className="text-xs text-muted-foreground">
                              ID #{log.company?.id ?? "--"} · {log.company?.slug ?? "--"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <pre className="whitespace-pre-wrap text-xs bg-muted/40 rounded p-2 max-h-32 overflow-auto">
                            {detailsLabel(log)}
                          </pre>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          <div>{log.ip_address ?? "--"}</div>
                          <div className="truncate max-w-[180px]">{log.user_agent ?? ""}</div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Página {meta.current_page} de {meta.last_page}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={!hasPrev || loading} onClick={() => setPage((p) => p - 1)}>
                  Anterior
                </Button>
                <Button variant="outline" size="sm" disabled={!hasNext || loading} onClick={() => setPage((p) => p + 1)}>
                  Próxima
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
