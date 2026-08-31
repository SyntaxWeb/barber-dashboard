import { AlertTriangle, CreditCard, ExternalLink, Link2Off, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import type { IntegrationSummary } from "@/services/integrationService";

type Props = {
  integrations: IntegrationSummary[];
  loading: boolean;
  actionProvider: string | null;
  onConnect: (provider: string) => void;
  onDisconnect: (provider: string) => void;
  onRefresh: () => void;
};

const formatDate = (value?: string | null) => {
  if (!value) return null;
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
};

export function ConfiguracoesIntegracoesTab({
  integrations,
  loading,
  actionProvider,
  onConnect,
  onDisconnect,
  onRefresh,
}: Props) {
  return (
    <TabsContent value="integracoes" className="grid gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Integrações</h2>
          <p className="text-sm text-muted-foreground">Conecte serviços externos para pagamentos e automações.</p>
        </div>
        <Button variant="outline" size="icon" onClick={onRefresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>


      <div className="flex gap-3 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div className="space-y-1">
          <p className="font-semibold">Atenção às taxas da integração</p>
          <p>
            Pagamentos processados por provedores externos podem ter tarifas, prazos de repasse, regras de
            estorno e análise antifraude definidos pelo próprio provedor. O SyntaxAtendimento não adiciona
            taxa extra sobre o Pix, mas as taxas do Mercado Pago podem ser aplicadas conforme sua conta.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {integrations.map((integration) => {
          const connected = integration.status === "connected";
          const connectedAt = formatDate(integration.connected_at);
          const account = String(integration.metadata.account_email ?? integration.metadata.account_name ?? "");
          const missingCredentials = integration.configuration_status === "missing_credentials";

          return (
            <Card key={integration.provider}>
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                      <Badge variant={connected ? "default" : "secondary"} className="mt-1">
                        {connected ? "Conectado" : missingCredentials ? "Configurar app" : "Nao conectado"}
                      </Badge>
                    </div>
                  </div>
                  <Badge variant="outline">{integration.type}</Badge>
                </div>
                <CardDescription>{integration.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(connected || missingCredentials) && (
                  <div className="space-y-1 rounded-md border bg-muted/30 p-3 text-sm">
                    {missingCredentials ? (
                      <p>Informe as credenciais OAuth do Mercado Pago no servidor para habilitar a conexao.</p>
                    ) : (
                      <>
                        <p>Pagamentos online: {integration.settings.online_payments_enabled ? "Ativos" : "Inativos"}</p>
                        {account && <p>Conta: {account}</p>}
                        {connectedAt && <p>Conectado em: {connectedAt}</p>}
                      </>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {connected ? (
                    <>
                      <Button variant="outline" disabled>
                        Configurar
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => onDisconnect(integration.slug)}
                        disabled={actionProvider === integration.slug}
                      >
                        <Link2Off className="mr-2 h-4 w-4" />
                        Desconectar
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => onConnect(integration.slug)}
                      disabled={missingCredentials || actionProvider === integration.slug}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Conectar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </TabsContent>
  );
}
