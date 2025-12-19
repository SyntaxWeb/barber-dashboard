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

async function api<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...authHeaders(),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Erro na requisição");
  }

  const payload = (await response.json()) as MaybeWrapped<T>;
  return unwrap(payload);
}

export interface CompanyReport {
  summary: {
    total_appointments: number;
    confirmed: number;
    completed: number;
    upcoming_week: number;
    revenue_month: number;
  };
  feedback: {
    average: number | null;
    responses: number;
    pending: number;
  };
  top_clients: Array<{
    cliente: string;
    telefone: string | null;
    total: number;
    last_visit: string | null;
  }>;
  services: Array<{
    service_id: number | null;
    servico: string;
    total: number;
    revenue: number;
  }>;
  trend: Array<{
    date: string;
    total: number;
  }>;
}

export async function fetchCompanyReport(): Promise<CompanyReport> {
  return api<CompanyReport>("/api/company/report");
}
