import { secureStorage } from "@/lib/secureStorage";
import { resolveMediaUrl } from "@/lib/media";
import { apiFetch } from "@/services/api";

const authHeaders = () => {
  const token = secureStorage.getItem("barbeiro-token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const response = await apiFetch(
    path,
    {
      ...options,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(options.headers || {}),
        ...authHeaders(),
      },
    },
    "provider",
  );

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
  image_url?: string | null;
  points_cost: number;
  active: boolean;
  grants_free_appointment?: boolean;
  image_file?: File | null;
  image_preview?: string | null;
  remove_image?: boolean;
}

type LoyaltyRewardPayload = {
  name: string;
  description?: string | null;
  points_cost: number;
  active: boolean;
  grants_free_appointment?: boolean;
  image?: File | null;
  remove_image?: boolean;
};

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
  const rewards = await api<LoyaltyReward[]>("/api/loyalty/rewards");
  return rewards.map((reward) => ({
    ...reward,
    image_url: resolveMediaUrl(reward.image_url),
    image_preview: resolveMediaUrl(reward.image_url),
    image_file: null,
    remove_image: false,
  }));
}

const buildRewardFormData = (payload: LoyaltyRewardPayload) => {
  const formData = new FormData();
  formData.append("name", payload.name);
  formData.append("description", payload.description ?? "");
  formData.append("points_cost", String(payload.points_cost));
  formData.append("active", payload.active ? "1" : "0");
  formData.append("grants_free_appointment", payload.grants_free_appointment ? "1" : "0");
  if (payload.image) {
    formData.append("image", payload.image);
  }
  if (payload.remove_image) {
    formData.append("remove_image", "1");
  }
  return formData;
};

export async function createLoyaltyReward(payload: LoyaltyRewardPayload): Promise<LoyaltyReward> {
  const reward = await api<LoyaltyReward>("/api/loyalty/rewards", {
    method: "POST",
    body: buildRewardFormData(payload),
  });
  return {
    ...reward,
    image_url: resolveMediaUrl(reward.image_url),
    image_preview: resolveMediaUrl(reward.image_url),
    image_file: null,
    remove_image: false,
  };
}

export async function updateLoyaltyReward(id: number, payload: LoyaltyRewardPayload): Promise<LoyaltyReward> {
  const formData = buildRewardFormData(payload);
  const reward = await api<LoyaltyReward>(`/api/loyalty/rewards/${id}`, {
    method: "PUT",
    body: formData,
  });
  return {
    ...reward,
    image_url: resolveMediaUrl(reward.image_url),
    image_preview: resolveMediaUrl(reward.image_url),
    image_file: null,
    remove_image: false,
  };
}

export async function deleteLoyaltyReward(id: number): Promise<void> {
  await api(`/api/loyalty/rewards/${id}`, { method: "DELETE" });
}
