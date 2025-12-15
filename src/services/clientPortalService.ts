import { Servico } from "@/data/mockData";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:4002";

type MaybeWrapped<T> = T | { data: T };

const unwrap = <T>(payload: MaybeWrapped<T>): T => {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
};

async function publicGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`);
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Erro na requisição");
  }

  const payload = (await response.json()) as MaybeWrapped<T>;
  return unwrap(payload);
}

async function privateRequest<T>(path: string, token: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  const contentType = response.headers.get("content-type") ?? "";

  if (!response.ok) {
    if (contentType.includes("application/json")) {
      try {
        const payload = await response.json();
        if (payload?.message) {
          throw new Error(payload.message);
        }
        throw new Error(JSON.stringify(payload));
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : "Erro na requisição");
      }
    }
    const text = await response.text();
    throw new Error(text || "Erro na requisição");
  }

  if (response.status === 204) {
    return {} as T;
  }

  if (!contentType.includes("application/json")) {
    return {} as T;
  }

  const payload = (await response.json()) as MaybeWrapped<T>;
  return unwrap(payload);
}

export async function clientFetchServicos(companySlug: string): Promise<Servico[]> {
  if (!companySlug) throw new Error("companySlug is required");
  return publicGet<Servico[]>(`/api/services?company=${encodeURIComponent(companySlug)}`);
}

export async function clientFetchHorarios(date: string, companySlug: string): Promise<string[]> {
  if (!companySlug) throw new Error("companySlug is required");
  const result = await publicGet<{ horarios: string[] }>(
    `/api/availability?date=${date}&company=${encodeURIComponent(companySlug)}`,
  );
  return result.horarios;
}

interface ClientAppointmentPayload {
  service_id: number;
  data: string;
  horario: string;
  observacoes?: string;
}

export async function clientCreateAgendamento(
  payload: ClientAppointmentPayload,
  token: string,
  companySlug: string,
): Promise<void> {
  if (!companySlug) throw new Error("companySlug is required");
  await privateRequest("/api/appointments", token, {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      company_slug: companySlug,
    }),
  });
}

export interface ClientAppointment {
  id: number;
  service_id: number;
  servico: string;
  preco?: number;
  data: string;
  horario: string;
  status: "confirmado" | "concluido" | "cancelado";
  observacoes?: string | null;
}

type ApiClientAppointment = {
  id: number;
  service_id?: number;
  service?: { id: number; nome: string; preco?: number };
  servico?: string;
  preco?: number;
  data: string;
  horario: string;
  status: "confirmado" | "concluido" | "cancelado";
  observacoes?: string | null;
};

const normalizeClientAppointment = (appointment: ApiClientAppointment): ClientAppointment => ({
  id: appointment.id,
  service_id: appointment.service?.id ?? appointment.service_id ?? 0,
  servico: appointment.service?.nome ?? appointment.servico ?? "Serviço",
  preco: appointment.service?.preco ?? appointment.preco,
  data: appointment.data,
  horario: appointment.horario,
  status: appointment.status,
  observacoes: appointment.observacoes ?? null,
});

export async function clientFetchAgendamentos(token: string): Promise<ClientAppointment[]> {
  const data = await privateRequest<ApiClientAppointment[]>("/api/clients/appointments", token);
  return data.map(normalizeClientAppointment);
}

interface ClientAppointmentUpdatePayload {
  service_id: number;
  data: string;
  horario: string;
  observacoes?: string;
}

export async function clientUpdateAgendamento(
  id: number,
  payload: ClientAppointmentUpdatePayload,
  token: string,
  companySlug: string,
): Promise<void> {
  await privateRequest(`/api/clients/appointments/${id}`, token, {
    method: "PUT",
    body: JSON.stringify({
      ...payload,
      company_slug: companySlug,
    }),
  });
}

export async function clientCancelarAgendamento(id: number, token: string): Promise<void> {
  await privateRequest(`/api/clients/appointments/${id}/cancel`, token, {
    method: "POST",
  });
}
