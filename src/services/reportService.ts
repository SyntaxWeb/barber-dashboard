import { secureStorage } from "@/lib/secureStorage";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:4002";

const authHeaders = () => {
  const token = secureStorage.getItem("barbeiro-token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

type MaybeWrapped<T> = T | { data: T };

const REPORT_ENDPOINTS = {
  company: "/api/company/report",
  system: ["/api/admin/system/report", "/api/admin/report"],
} as const;

const unwrap = <T>(payload: MaybeWrapped<T>): T => {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
};

type ApiError = Error & { status?: number };

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
    const error = new Error(message || "Erro na requisição") as ApiError;
    error.status = response.status;
    throw error;
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
  system_overview?: {
    total_companies?: number;
    active_companies?: number;
    new_companies_30d?: number;
    active_providers?: number;
    total_clients?: number;
    new_clients_30d?: number;
    revenue_month?: number;
  };
  plans_breakdown?: Array<{ label: string; total: number }>;
  status_breakdown?: Array<{ label: string; total: number }>;
  recent_companies?: Array<{
    id: number;
    nome: string;
    subscription_plan?: string | null;
    subscription_status?: string | null;
    created_at?: string | null;
  }>;
}

export async function fetchCompanyReport(): Promise<CompanyReport> {
  return api<CompanyReport>(REPORT_ENDPOINTS.company);
}

export async function fetchSystemReport(): Promise<CompanyReport> {
  const candidates = Array.isArray(REPORT_ENDPOINTS.system) ? REPORT_ENDPOINTS.system : [REPORT_ENDPOINTS.system];
  let lastError: Error | null = null;

  for (const endpoint of candidates) {
    try {
      return await api<CompanyReport>(endpoint);
    } catch (error) {
      const apiError = error as ApiError;
      lastError = apiError;
      if (apiError.status === 404) {
        continue;
      }
      throw apiError;
    }
  }

  if (lastError) {
    throw lastError;
  }

  throw new Error("Não foi possível carregar o relatório do sistema.");
}
