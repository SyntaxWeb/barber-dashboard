export type AuthScope = "provider" | "client" | "any";

import { API_URL } from "@/lib/apiConfig";
const AUTH_EXPIRED_EVENT = "auth:expired";

export const apiFetch = async (path: string, options: RequestInit = {}, scope: AuthScope = "any") => {
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  if (options.signal?.aborted) controller.abort();
  else options.signal?.addEventListener("abort", onAbort, { once: true });
  let timedOut = false;
  // Bound reads used by effects; writes retain their existing server-side semantics.
  const timer = (options.method ?? "GET").toUpperCase() === "GET" ? setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, 30000) : undefined;
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: { Accept: "application/json", ...(options.headers || {}) },
    });
  } catch (error) {
    if (timedOut) throw new Error("A consulta demorou para responder. Verifique a conexão e tente novamente.");
    throw error;
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", onAbort);
  }

  if (!options.signal?.aborted && (response.status === 401 || response.status === 419)) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(AUTH_EXPIRED_EVENT, {
          detail: { scope, token: new Headers(options.headers).get("Authorization")?.replace(/^Bearer\s+/i, "") },
        }),
      );
    }
  }

  return response;
};

export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); this.name = "ApiError"; }
}

export async function handleResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    let message = fallbackMessage;
    try {
      const payload = JSON.parse(text);
      const fields = payload.errors ? Object.values(payload.errors).flat().filter((value): value is string => typeof value === "string") : [];
      message = fields.length ? fields.join(" ") : typeof payload.message === "string" ? payload.message : fallbackMessage;
    } catch { /* HTML and server diagnostics should not be shown to users. */ }
    if (response.status >= 500) message = "O serviço está temporariamente indisponível. Tente novamente em instantes.";
    if (response.status === 429) message = "Muitas tentativas. Aguarde um instante e tente novamente.";
    throw new ApiError(message, response.status);
  }
  return (await response.json()) as T;
}
