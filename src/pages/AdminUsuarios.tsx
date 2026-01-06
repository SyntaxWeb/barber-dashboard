import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  fetchPlans,
  fetchProviders,
  fetchMercadoPagoSubscriptions,
  syncMercadoPagoPlans,
  updateProviderSubscription,
  MercadoPagoSubscription,
} from "@/services/adminService";
import { useToast } from "@/hooks/use-toast";

interface Provider {
  id: number;
  name: string;
  email: string;
  company?: {
    id: number;
    nome: string;
    subscription_plan: string;
    subscription_status: string;
    subscription_price: string;
    subscription_renews_at?: string | null;
  };
}

export default function AdminUsuarios() {
  const { toast } = useToast();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [plans, setPlans] = useState<Record<string, { name: string; price: number; months: number }>>({});
  const [statuses, setStatuses] = useState<string[]>([]);
  const [selected, setSelected] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const ALL_OPTION = "all";
  const [filters, setFilters] = useState({ plan: "", status: "" });
  const [form, setForm] = useState({ plan: "", status: "", price: "", renews_at: "" });
  const [mpSubscriptions, setMpSubscriptions] = useState<MercadoPagoSubscription[]>([]);
  const [mpLoading, setMpLoading] = useState(false);
  const [mpError, setMpError] = useState<string | null>(null);
  const [syncingPlans, setSyncingPlans] = useState(false);
  const [planSyncResults, setPlanSyncResults] = useState<Array<{ key: string; status: string; plan_id?: string | null }>>([]);

  const formatCurrency = (value?: number, currencyId?: string) => {
    if (value === undefined || value === null) return "--";
    try {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: currencyId || "BRL",
        minimumFractionDigits: 2,
      }).format(value);
    } catch {
      return `${value} ${currencyId ?? ""}`.trim();
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const describeCycle = (subscription: MercadoPagoSubscription) => {
    const recurrence = subscription.auto_recurring;
    if (!recurrence?.frequency || !recurrence.frequency_type) {
      return "--";
    }

    const unit =
      recurrence.frequency_type === "months"
        ? "mes(es)"
        : recurrence.frequency_type === "days"
          ? "dia(s)"
          : recurrence.frequency_type;

    return `${recurrence.frequency} ${unit}`;
  };

  const load = () => {
    setLoading(true);
    Promise.all([fetchProviders(filters), fetchPlans()])
      .then(([providersData, plansData]) => {
        setProviders(providersData as Provider[]);
        setPlans(plansData.plans);
        setStatuses(plansData.statuses);
      })
      .finally(() => setLoading(false));
  };

  const loadMercadoPago = () => {
    setMpLoading(true);
    setMpError(null);
    fetchMercadoPagoSubscriptions()
      .then((data) => {
        setMpSubscriptions(data);
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : "Nao foi possivel consultar o Mercado Pago.";
        setMpError(message);
        toast({
          title: "Erro ao consultar Mercado Pago",
          description: message,
          variant: "destructive",
        });
      })
      .finally(() => setMpLoading(false));
  };

  const handleSyncMercadoPagoPlans = () => {
    setSyncingPlans(true);
    syncMercadoPagoPlans()
      .then((results) => {
        setPlanSyncResults(results);
        toast({
          title: "Planos sincronizados",
          description: "Os planos foram verificados no Mercado Pago.",
        });
        loadMercadoPago();
      })
      .catch((error) => {
        toast({
          title: "Erro ao sincronizar planos",
          description: error instanceof Error ? error.message : "Nao foi possivel sincronizar os planos.",
          variant: "destructive",
        });
      })
      .finally(() => setSyncingPlans(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.plan, filters.status]);

  useEffect(() => {
    loadMercadoPago();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const handleSelectProvider = (provider: Provider) => {
    setSelected(provider);
    setForm({
      plan: provider.company?.subscription_plan ?? "",
      status: provider.company?.subscription_status ?? "",
      price: provider.company?.subscription_price ?? "",
      renews_at: provider.company?.subscription_renews_at ?? "",
    });
  };

  const handleUpdate = async () => {
    if (!selected?.company?.id) return;
    try {
      await updateProviderSubscription(selected.company.id, {
        plan: form.plan,
        status: form.status,
        price: Number(form.price || 0),
        renews_at: form.renews_at || undefined,
      });
      toast({ title: "Assinatura atualizada" });
      setSelected(null);
      load();
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Superadmin & Prestadores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Plano</Label>
                <Select
                  value={filters.plan || ALL_OPTION}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, plan: value === ALL_OPTION ? "" : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os planos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_OPTION}>Todos</SelectItem>
                    {Object.entries(plans).map(([key, plan]) => (
                      <SelectItem key={key} value={key}>
                        {plan.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={filters.status || ALL_OPTION}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value === ALL_OPTION ? "" : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_OPTION}>Todos</SelectItem>
                    {statuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={load}>
                  Atualizar lista
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="flex h-32 items-center justify-center text-muted-foreground">Carregando...</div>
            ) : (
              <div className="grid gap-3">
                {providers.map((provider) => (
                  <div
                    key={provider.id}
                    className="rounded-lg border p-4 cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSelectProvider(provider)}
                  >
                    <p className="font-semibold">{provider.name}</p>
                    <p className="text-sm text-muted-foreground">{provider.email}</p>
                    <p className="text-sm">
                      Plano: <strong>{provider.company?.subscription_plan ?? "-"}</strong> - Status:{" "}
                      <strong>{provider.company?.subscription_status ?? "-"}</strong>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Assinaturas no Mercado Pago</CardTitle>
                <p className="text-sm text-muted-foreground">Consulte e sincronize as adesoes recorrentes da sua conta Mercado Pago.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={handleSyncMercadoPagoPlans} disabled={syncingPlans}>
                  {syncingPlans ? "Criando planos..." : "Criar/Atualizar planos"}
                </Button>
                <Button variant="outline" size="sm" onClick={loadMercadoPago} disabled={mpLoading}>
                  {mpLoading ? "Sincronizando..." : "Atualizar dados"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {planSyncResults.length > 0 && (
              <div className="rounded-lg border border-muted p-3 text-sm">
                <p className="mb-2 font-semibold text-muted-foreground">Resultado da ultima sincronizacao:</p>
                <ul className="space-y-1">
                  {planSyncResults.map((result) => (
                    <li key={result.key} className="flex items-center justify-between gap-2">
                      <span>
                        {result.key} - {result.status === "created" ? "criado" : "ja existia"}
                      </span>
                      <span className="text-xs text-muted-foreground">{result.plan_id ?? "--"}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {mpLoading ? (
              <div className="flex h-24 items-center justify-center text-muted-foreground">Sincronizando com Mercado Pago...</div>
            ) : mpError ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{mpError}</div>
            ) : mpSubscriptions.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
                Nenhuma assinatura encontrada na conta Mercado Pago vinculada.
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="pb-2 pr-3 font-medium">Assinatura</th>
                      <th className="pb-2 pr-3 font-medium">Status</th>
                      <th className="pb-2 pr-3 font-medium">Cliente</th>
                      <th className="pb-2 pr-3 font-medium">Valor</th>
                      <th className="pb-2 pr-3 font-medium">Ciclo</th>
                      <th className="pb-2 pr-3 font-medium">Proximo pagamento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mpSubscriptions.slice(0, 15).map((subscription) => (
                      <tr key={subscription.id} className="border-t">
                        <td className="py-2 pr-3">
                          <div className="font-medium">{subscription.reason || subscription.id}</div>
                          <div className="text-xs text-muted-foreground">{subscription.preapproval_plan_id || "Sem plano"}</div>
                        </td>
                        <td className="py-2 pr-3 capitalize">{subscription.status ?? "--"}</td>
                        <td className="py-2 pr-3">
                          <div>{subscription.payer_email ?? "--"}</div>
                          {subscription.external_reference && (
                            <div className="text-xs text-muted-foreground">Ref: {subscription.external_reference}</div>
                          )}
                        </td>
                        <td className="py-2 pr-3">
                          {formatCurrency(
                            subscription.auto_recurring?.transaction_amount,
                            subscription.auto_recurring?.currency_id,
                          )}
                        </td>
                        <td className="py-2 pr-3">{describeCycle(subscription)}</td>
                        <td className="py-2 pr-3">{formatDate(subscription.next_payment_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {mpSubscriptions.length > 15 && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Exibindo as {Math.min(15, mpSubscriptions.length)} primeiras assinaturas de um total de {mpSubscriptions.length}.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {selected && (
          <Card>
            <CardHeader>
              <CardTitle>Editar assinatura de {selected.company?.nome ?? selected.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Plano</Label>
                  <Select value={form.plan} onValueChange={(value) => setForm((prev) => ({ ...prev, plan: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(plans).map(([key, plan]) => (
                        <SelectItem key={key} value={key}>
                          {plan.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(value) => setForm((prev) => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Valor (R$)</Label>
                  <Input value={form.price} onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Renova em</Label>
                  <Input
                    type="date"
                    value={form.renews_at ? form.renews_at.split("T")[0] : ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, renews_at: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUpdate}>Salvar</Button>
                <Button variant="ghost" onClick={() => setSelected(null)}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
