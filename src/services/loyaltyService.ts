import { secureStorage } from "@/lib/secureStorage";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:4002";

const authHeaders = () => {
  const token = secureStorage.getItem("barbeiro-token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...authHeaders(),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Erro na requisição");
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

export type LoyaltyRuleType = "spend" | "visits";

export interface LoyaltySettings {
  enabled: boolean;
  rule_type: LoyaltyRuleType;
  spend_amount_cents_per_point: number;
  points_per_visit: number;
  expiration_enabled: boolean;
  expiration_days?: number | null;
}

export interface LoyaltyReward {
  id: number;
  name: string;
  description?: string | null;
  points_cost: number;
  active: boolean;
}

export async function fetchLoyaltySettings(): Promise<LoyaltySettings> {
  return api<LoyaltySettings>("/api/loyalty/settings");
}

export async function updateLoyaltySettings(payload: LoyaltySettings): Promise<LoyaltySettings> {
  return api<LoyaltySettings>("/api/loyalty/settings", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function fetchLoyaltyRewards(): Promise<LoyaltyReward[]> {
  return api<LoyaltyReward[]>("/api/loyalty/rewards");
}

export async function createLoyaltyReward(payload: Omit<LoyaltyReward, "id">): Promise<LoyaltyReward> {
  return api<LoyaltyReward>("/api/loyalty/rewards", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateLoyaltyReward(id: number, payload: Partial<Omit<LoyaltyReward, "id">>): Promise<LoyaltyReward> {
  return api<LoyaltyReward>(`/api/loyalty/rewards/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );
}

export async function deleteLoyaltyReward(id: number): Promise<void> {
  await api(`/api/loyalty/rewards/${id}`, { method: "DELETE" });
}
