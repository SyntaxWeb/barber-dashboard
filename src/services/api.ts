export type AuthScope = "provider" | "client" | "any";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:4002";
const AUTH_EXPIRED_EVENT = "auth:expired";

export const apiFetch = async (path: string, options: RequestInit = {}, scope: AuthScope = "any") => {
  const response = await fetch(`${API_URL}${path}`, options);

  if (response.status === 401 || response.status === 419) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(AUTH_EXPIRED_EVENT, {
          detail: { scope },
        }),
      );
    }
  }

  return response;
};

export async function handleResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || fallbackMessage);
  }
  return (await response.json()) as T;
}
