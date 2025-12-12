const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:4002";

const authHeaders = () => {
  const token = localStorage.getItem("barbeiro-token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Erro ao consultar dados");
  }
  return (await response.json()) as T;
}

export async function fetchProviders(params?: { plan?: string; status?: string }) {
  const query = new URLSearchParams();
  if (params?.plan) query.append("plan", params.plan);
  if (params?.status) query.append("status", params.status);

  const response = await fetch(`${API_URL}/api/admin/providers?${query.toString()}`, {
    headers: {
      Accept: "application/json",
      ...authHeaders(),
    },
  });

  return handleResponse(response);
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
  const response = await fetch(`${API_URL}/api/admin/plans`, {
    headers: {
      Accept: "application/json",
      ...authHeaders(),
    },
  });

  return handleResponse<{
    plans: Record<string, { name: string; price: number; months: number }>;
    statuses: string[];
  }>(response);
}

export async function updateProviderSubscription(companyId: number, payload: { plan: string; status: string; price: number; renews_at?: string }) {
  const response = await fetch(`${API_URL}/api/admin/providers/${companyId}/subscription`, {
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
  });

  return handleResponse(response);
}

export async function fetchMercadoPagoSubscriptions() {
  const response = await fetch(`${API_URL}/api/admin/mercado-pago/subscriptions`, {
    headers: {
      Accept: "application/json",
      ...authHeaders(),
    },
  });

  const data = await handleResponse<{ data: MercadoPagoSubscription[] }>(response);
  return data.data;
}

type PlanSyncResult = {
  key: string;
  status: string;
  plan_id?: string | null;
};

export async function syncMercadoPagoPlans() {
  const response = await fetch(`${API_URL}/api/admin/mercado-pago/plans/sync`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      ...authHeaders(),
    },
  });

  const data = await handleResponse<{ data: PlanSyncResult[] }>(response);
  return data.data;
}
