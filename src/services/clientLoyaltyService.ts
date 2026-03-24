import { secureStorage } from "@/lib/secureStorage";
import { resolveMediaUrl } from "@/lib/media";
import { apiFetch } from "@/services/api";

const clientHeaders = () => {
  const token = secureStorage.getItem("cliente-token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await apiFetch(
    path,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        ...clientHeaders(),
      },
    },
    "client",
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Erro na requisição");
  }

  return (await response.json()) as T;
}

export interface ClientLoyaltyReward {
  id: number;
  name: string;
  description?: string | null;
  image_url?: string | null;
  points_cost: number;
  active: boolean;
  grants_free_appointment?: boolean;
}

export interface ClientLoyaltyTransaction {
  id: number;
  type: string;
  points: number;
  reason?: string | null;
  created_at?: string | null;
}

export interface ClientLoyaltySummary {
  points_balance: number;
  rewards: ClientLoyaltyReward[];
  transactions: ClientLoyaltyTransaction[];
  pending_redemptions: Array<{
    id: number;
    status: string;
    created_at?: string | null;
    reward: ClientLoyaltyReward;
  }>;
}

export async function fetchClientLoyalty(): Promise<ClientLoyaltySummary> {
  const summary = await api<ClientLoyaltySummary>("/api/clients/loyalty");
  return {
    ...summary,
    rewards: summary.rewards.map((reward) => ({
      ...reward,
      image_url: resolveMediaUrl(reward.image_url),
    })),
    pending_redemptions: (summary.pending_redemptions ?? []).map((item) => ({
      ...item,
      reward: {
        ...item.reward,
        image_url: resolveMediaUrl(item.reward?.image_url),
      },
    })),
  };
}

export async function redeemClientReward(rewardId: number): Promise<{ points_balance: number }> {
  return api<{ points_balance: number }>("/api/clients/loyalty/redeem", {
    method: "POST",
    body: JSON.stringify({ reward_id: rewardId }),
  });
}
