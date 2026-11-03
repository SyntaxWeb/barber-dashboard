import { secureStorage } from "@/lib/secureStorage";
import { apiFetch, handleResponse } from "@/services/api";

const authHeaders = () => {
  const token = secureStorage.getItem("barbeiro-token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await apiFetch(path, { ...options, headers: { Accept: "application/json", ...authHeaders(), ...options.headers } }, "provider");
  if (response.status === 204) return {} as T;
  return handleResponse<T>(response, "Não foi possível concluir a operação com o WhatsApp.");
}

export interface WhatsappStatusPayload {
  connected?: boolean;
  state?: string;
  status?: string;
  phone?: { device_model?: string; pushname?: string; wid?: { user?: string } };
}
export interface WhatsappSessionResponse {
  session_id?: string | null;
  provider?: string;
  configured?: boolean;
  pairing?: boolean;
  status?: WhatsappStatusPayload | null;
  qr_code?: string | null;
}
export interface WhatsappDelivery {
  id: number;
  recipient: string;
  status: string;
  action: string;
  appointment_id?: number | null;
  error?: string | null;
  created_at: string;
}
export const normalizeQrCode = (value?: string | null): string | null => {
  if (!value) return null;
  return value.startsWith("data:image") ? value : `data:image/png;base64,${value}`;
};
export async function fetchWhatsappSession(options: { refreshQr?: boolean; signal?: AbortSignal } = {}): Promise<WhatsappSessionResponse> {
  return request<WhatsappSessionResponse>(`/api/company/whatsapp/session${options.refreshQr ? "?refresh_qr=1" : ""}`, { signal: options.signal });
}
export async function startWhatsappSession(): Promise<WhatsappSessionResponse> {
  return request<WhatsappSessionResponse>("/api/company/whatsapp/session", { method: "POST" });
}
export async function logoutWhatsappSession(): Promise<void> {
  await request("/api/company/whatsapp/session", { method: "DELETE" });
}
export async function sendWhatsappTest(): Promise<{ message: string; status: string }> {
  return request("/api/company/whatsapp/test", { method: "POST" });
}
export async function fetchWhatsappDeliveries(signal?: AbortSignal): Promise<WhatsappDelivery[]> {
  const result = await request<{ data: WhatsappDelivery[] }>("/api/company/whatsapp/notifications", { signal });
  return result.data;
}
