import { secureStorage } from "@/lib/secureStorage";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:4002";

const authHeaders = () => {
  const token = secureStorage.getItem("barbeiro-token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

type MaybeWrapped<T> = T | { data: T };

const unwrap = <T>(payload: MaybeWrapped<T>): T => {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
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

  const payload = (await response.json()) as MaybeWrapped<T>;
  return unwrap(payload);
}

export interface Cliente {
  id: number;
  nome: string;
  email: string;
  telefone?: string | null;
  observacoes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateClientePayload {
  nome: string;
  email: string;
  telefone: string;
  observacoes?: string;
}

export async function fetchClientes(search?: string): Promise<Cliente[]> {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return api<Cliente[]>(`/api/clients${query}`);
}

export async function createCliente(payload: CreateClientePayload): Promise<Cliente> {
  return api<Cliente>("/api/clients", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
