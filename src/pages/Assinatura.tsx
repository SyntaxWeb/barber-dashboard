import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchSubscriptionSummary, requestSubscriptionCheckout } from "@/services/subscriptionService";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SubscriptionSummary {
  company: {
    subscription_plan: string;
    subscription_status: string;
    subscription_price: string;
    subscription_renews_at: string | null;
  };
  plan: {
    name: string;
    price: number;
    months: number;
    key: string;
  } | null;
  available_plans: Array<{
    name: string;
    price: number;
    months: number;
    key: string;
  }>;
  latest_order?: {
    status: string;
    checkout_url: string | null;
    created_at: string;
  } | null;
}

export default function Assinatura() {
  const [summary, setSummary] = useState<SubscriptionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscriptionSummary()
      .then(setSummary)
      .catch((err) => setError(err instanceof Error ? err.message : "Nao foi possivel carregar a assinatura."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-48">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </Layout>
    );
  }

  if (!summary) {
    return (
      <Layout>
        <Card>
          <CardHeader>
            <CardTitle>Assinatura</CardTitle>
            <CardDescription>Nao encontramos informacoes da sua assinatura.</CardDescription>
          </CardHeader>
        </Card>
      </Layout>
    );
  }

  const { company, plan, available_plans: availablePlans, latest_order: latestOrder } = summary;
  const renewsAt = company.subscription_renews_at
    ? format(parseISO(company.subscription_renews_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : "Nao definida";
  const subscriptionInactive = company.subscription_status !== "ativo";
  const pendingCheckoutUrl = latestOrder?.status === "pendente" ? latestOrder.checkout_url : null;
console.log(latestOrder)
  const handleCheckout = async (planKey: string) => {
    setCheckoutPlan(planKey);
    setError(null);
    try {
      const response = await requestSubscriptionCheckout(planKey);
      const url = response.checkout_url;
      if (url) {
        window.location.href = url;
      } else {
        setError("Nao conseguimos gerar o link de pagamento. Tente novamente.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel iniciar a assinatura.");
    } finally {
      setCheckoutPlan(null);
    }
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Minha assinatura</CardTitle>
            <CardDescription>Gerencie seu plano atual e status de pagamento.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscriptionInactive && (
              <div className="rounded-lg border border-amber-500/50 bg-amber-50 p-3 text-sm text-amber-900">
                Sua assinatura esta <strong>{company.subscription_status}</strong>. Escolha um plano para reativar o acesso completo.
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Plano atual</p>
                <p className="text-2xl font-bold">{plan?.name ?? company.subscription_plan}</p>
                <p className="text-sm text-muted-foreground">
                  Ciclo: {plan ? `${plan.months} meses` : "personalizado"}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-2xl font-bold capitalize">{company.subscription_status}</p>
                <p className="text-sm text-muted-foreground">Renova em {renewsAt}</p>
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Valor</p>
              <p className="text-2xl font-bold">
                R$ {Number(company.subscription_price || plan?.price || 0).toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">
                Escolha um dos planos abaixo para atualizar ou reativar sua assinatura automaticamente.
              </p>
              {latestOrder && latestOrder.status === "pendente" && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm text-amber-600">
                    Temos um pagamento pendente. Abra o link gerado anteriormente ou gere um novo plano abaixo.
                  </p>
                  {pendingCheckoutUrl && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => window.open(pendingCheckoutUrl, "_blank", "noopener,noreferrer")}
                    >
                      Continuar pagamento
                    </Button>
                  )}
                </div>
              )}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-3">
          {availablePlans.map((availablePlan) => {
            const isCurrent = availablePlan.key === company.subscription_plan;
            const canCheckout = subscriptionInactive || !isCurrent;
            return (
              <Card key={availablePlan.key} className={isCurrent ? "border-primary" : undefined}>
                <CardHeader>
                  <CardTitle className="text-lg">{availablePlan.name}</CardTitle>
                  <CardDescription>{availablePlan.months} mes(es)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-2xl font-bold">R$ {availablePlan.price.toFixed(2)}</p>
                  <Button
                    type="button"
                    disabled={!canCheckout || checkoutPlan === availablePlan.key}
                    onClick={() => handleCheckout(availablePlan.key)}
                  >
                    {checkoutPlan === availablePlan.key ? "Gerando link..." : isCurrent ? "Reativar plano" : "Assinar agora"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
