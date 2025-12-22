import { secureStorage } from "@/lib/secureStorage";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:4002";

const authHeaders = () => {
  const token = secureStorage.getItem("barbeiro-token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function handleResponse<T>(response: Response): Promise<T> {
  const isJson = response.headers.get("content-type")?.includes("application/json");
  if (!response.ok) {
    if (isJson) {
      try {
        const payload = await response.json();
        if (payload?.message) {
          throw new Error(payload.message);
        }
        throw new Error(JSON.stringify(payload));
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Erro ao consultar assinatura");
      }
    }
    const text = await response.text();
    throw new Error(text || "Erro ao consultar assinatura");
  }
  return (await response.json()) as T;
}

export async function fetchSubscriptionSummary() {
  const response = await fetch(`${API_URL}/api/subscription`, {
    headers: {
      Accept: "application/json",
      ...authHeaders(),
    },
  });

  return handleResponse<{
    company: {
      id: number;
      nome: string;
      subscription_plan: string;
      subscription_status: string;
      subscription_price: string;
      subscription_renews_at: string | null;
    };
    plan: {
      key: string;
      name: string;
      price: number;
      months: number;
    } | null;
    available_plans: Array<{
      key: string;
      name: string;
      price: number;
      months: number;
    }>;
    latest_order?: {
      status: string;
      checkout_url: string | null;
      created_at: string;
    } | null;
  }>(response);
}

export async function requestSubscriptionCheckout(plan: string) {
  const response = await fetch(`${API_URL}/api/subscription/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ plan }),
  });

  return handleResponse<{
    checkout_url: string | null;
    order_id: number;
  }>(response);
}
