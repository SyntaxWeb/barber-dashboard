import { secureStorage } from "@/lib/secureStorage";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:4002";

const authHeaders = () => {
  const token = secureStorage.getItem("barbeiro-token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Erro na requisição");
  }

  if (response.status === 204) {
    return {} as T;
  }

  const text = await response.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      Accept: "application/json",
      ...authHeaders(),
      ...(options.headers ?? {}),
    },
    body: options.body,
  });

  return handleResponse<T>(response);
}

export interface WhatsappStatusPayload {
  connected?: boolean;
  state?: string;
  status?: string;
  phone?: {
    device_model?: string;
    pushname?: string;
    wid?: { user?: string };
  };
}

export interface WhatsappSessionResponse {
  session_id?: string | null;
  status?: WhatsappStatusPayload | null;
  qr_code?: string | null;
}

export const normalizeQrCode = (value?: string | null): string | null => {
  if (!value) return null;
  return value.startsWith("data:image") ? value : `data:image/png;base64,${value}`;
};

export async function fetchWhatsappSession(): Promise<WhatsappSessionResponse> {
  return request<WhatsappSessionResponse>("/api/company/whatsapp/session");
}

export async function startWhatsappSession(): Promise<WhatsappSessionResponse> {
  return request<WhatsappSessionResponse>("/api/company/whatsapp/session", { method: "POST" });
}

export async function logoutWhatsappSession(): Promise<void> {
  await request("/api/company/whatsapp/session", { method: "DELETE" });
}
