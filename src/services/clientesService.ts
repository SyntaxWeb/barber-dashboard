import { secureStorage } from "@/lib/secureStorage";
import { apiFetch } from "@/services/api";

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
  const response = await apiFetch(
    path,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
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

export interface ClienteLoyaltyTransaction {
  id: number;
  type: string;
  points: number;
  reason?: string | null;
  created_at?: string | null;
}

export interface ClienteAppointmentHistory {
  id: number;
  data?: string | null;
  horario?: string | null;
  servico?: string | null;
  preco?: number | null;
  status?: string | null;
}

export interface ClienteHistory {
  client: Cliente;
  loyalty: {
    points_balance: number;
    transactions: ClienteLoyaltyTransaction[];
  };
  appointments: ClienteAppointmentHistory[];
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

export async function fetchClienteHistory(id: number): Promise<ClienteHistory> {
  return api<ClienteHistory>(`/api/clients/${id}/history`);
}
