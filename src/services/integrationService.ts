import { secureStorage } from "@/lib/secureStorage";
import { apiFetch, handleResponse } from "@/services/api";

export type IntegrationSummary = {
  provider: string;
  slug: string;
  name: string;
  type: string;
  enabled: boolean;
  description?: string | null;
  status: "connected" | "disconnected" | string;
  settings: Record<string, unknown>;
  metadata: Record<string, unknown>;
  configuration_status?: "ready" | "missing_credentials" | string;
  connected_at?: string | null;
  disconnected_at?: string | null;
};

const authHeaders = () => {
  const token = secureStorage.getItem("barbeiro-token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function fetchIntegrations(): Promise<IntegrationSummary[]> {
  const response = await apiFetch(
    "/api/settings/integrations",
    { headers: { ...authHeaders() } },
    "provider",
  );
  const payload = await handleResponse<{ data: IntegrationSummary[] }>(response, "Nao foi possivel carregar integracoes.");
  return payload.data;
}

export async function connectIntegration(provider: string): Promise<{ authorization_url: string }> {
  const response = await apiFetch(
    `/api/settings/integrations/${encodeURIComponent(provider)}/connect`,
    {
      method: "POST",
      headers: { ...authHeaders() },
    },
    "provider",
  );
  return handleResponse<{ authorization_url: string }>(response, "Nao foi possivel iniciar a conexao.");
}

export async function disconnectIntegration(provider: string): Promise<void> {
  const response = await apiFetch(
    `/api/settings/integrations/${encodeURIComponent(provider)}`,
    {
      method: "DELETE",
      headers: { ...authHeaders() },
    },
    "provider",
  );
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Nao foi possivel desconectar a integracao.");
  }
}
