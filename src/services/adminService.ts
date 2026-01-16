import { secureStorage } from "@/lib/secureStorage";
import { apiFetch, handleResponse } from "@/services/api";

const authHeaders = () => {
  const token = secureStorage.getItem("barbeiro-token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function fetchProviders(params?: { plan?: string; status?: string }) {
  const query = new URLSearchParams();
  if (params?.plan) query.append("plan", params.plan);
  if (params?.status) query.append("status", params.status);

  const response = await apiFetch(
    `/api/admin/providers?${query.toString()}`,
    {
    headers: {
      Accept: "application/json",
      ...authHeaders(),
    },
    },
    "provider",
  );

  return handleResponse(response, "Erro ao consultar dados");
}

export type MercadoPagoSubscription = {
  id: string;
  status: string;
  reason?: string;
  payer_email?: string;
  payer_id?: string | number;
  external_reference?: string;
  preapproval_plan_id?: string;
  next_payment_date?: string;
  auto_recurring?: {
    frequency?: number;
    frequency_type?: string;
    transaction_amount?: number;
    currency_id?: string;
  };
};

export async function fetchPlans() {
  const response = await apiFetch(
    "/api/admin/plans",
    {
    headers: {
      Accept: "application/json",
      ...authHeaders(),
    },
    },
    "provider",
  );

  return handleResponse<{
    plans: Record<string, { name: string; price: number; months: number }>;
    statuses: string[];
  }>(response, "Erro ao consultar dados");
}

export async function updateProviderSubscription(companyId: number, payload: { plan: string; status: string; price: number; renews_at?: string }) {
  const response = await apiFetch(
    `/api/admin/providers/${companyId}/subscription`,
    {
      method: "POST",
      headers: {
        ...authHeaders(),
      },
      body: (() => {
        const formData = new FormData();
        formData.append("plan", payload.plan);
        formData.append("status", payload.status);
        formData.append("price", String(payload.price));
        if (payload.renews_at) {
          formData.append("renews_at", payload.renews_at);
        }
        return formData;
      })(),
    },
    "provider",
  );

  return handleResponse(response, "Erro ao consultar dados");
}

export async function fetchMercadoPagoSubscriptions() {
  const response = await apiFetch(
    "/api/admin/mercado-pago/subscriptions",
    {
      headers: {
        Accept: "application/json",
        ...authHeaders(),
      },
    },
    "provider",
  );

  const data = await handleResponse<{ data: MercadoPagoSubscription[] }>(response, "Erro ao consultar dados");
  return data.data;
}

type PlanSyncResult = {
  key: string;
  status: string;
  plan_id?: string | null;
};

export async function syncMercadoPagoPlans() {
  const response = await apiFetch(
    "/api/admin/mercado-pago/plans/sync",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        ...authHeaders(),
      },
    },
    "provider",
  );

  const data = await handleResponse<{ data: PlanSyncResult[] }>(response, "Erro ao consultar dados");
  return data.data;
}

export interface ActivityLog {
  id: number;
  action: string;
  details?: Record<string, unknown> | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at?: string;
  user?: { id?: number; name?: string; email?: string };
  company?: { id?: number; nome?: string; slug?: string };
}

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  };
}

interface ActivityLogFilters {
  page?: number;
  per_page?: number;
  company_id?: string;
  user_id?: string;
  action?: string;
}

export async function fetchActivityLogs(filters: ActivityLogFilters = {}) {
  const query = new URLSearchParams();
  if (filters.page) query.append("page", String(filters.page));
  if (filters.per_page) query.append("per_page", String(filters.per_page));
  if (filters.company_id) query.append("company_id", filters.company_id);
  if (filters.user_id) query.append("user_id", filters.user_id);
  if (filters.action) query.append("action", filters.action);

  const response = await apiFetch(
    `/api/admin/logs?${query.toString()}`,
    {
    headers: {
      Accept: "application/json",
      ...authHeaders(),
    },
    },
    "provider",
  );

  return handleResponse<PaginatedResponse<ActivityLog>>(response, "Erro ao consultar dados");
}
