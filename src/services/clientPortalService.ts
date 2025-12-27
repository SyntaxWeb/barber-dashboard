import { Servico } from "@/data/mockData";
import { AvailabilityData, normalizeAvailabilityResponse } from "@/lib/availability";

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

export async function clientFetchHorarios(
  date: string,
  companySlug: string,
  serviceId?: number,
  appointmentId?: number,
): Promise<AvailabilityData> {
  if (!companySlug) throw new Error("companySlug is required");
  const params = new URLSearchParams({
    date,
    company: companySlug,
  });
  if (serviceId) {
    params.set("service_id", serviceId.toString());
  }
  if (appointmentId) {
    params.set("appointment_id", appointmentId.toString());
  }
  const result = await publicGet<{
    horarios?: string[];
    horas?: string[];
    minutos_por_hora?: Record<string, string[]>;
  }>(`/api/availability?${params.toString()}`);
  return normalizeAvailabilityResponse(result);
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

export interface AppointmentFeedback {
  service_rating: number;
  professional_rating: number;
  scheduling_rating: number;
  comment?: string | null;
  allow_public_testimonial?: boolean;
  submitted_at?: string | null;
  average_rating?: number | null;
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
  company?: {
    id?: number;
    nome?: string;
    slug?: string;
  } | null;
  feedback?: AppointmentFeedback | null;
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
  company?: {
    id?: number;
    nome?: string;
    slug?: string;
  } | null;
  feedback?: AppointmentFeedback | null;
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
  company: appointment.company ?? null,
  feedback: appointment.feedback ?? null,
});

export async function clientFetchAgendamentos(token: string): Promise<ClientAppointment[]> {
  const data = await privateRequest<ApiClientAppointment[]>("/api/clients/appointments", token);
  return data.map(normalizeClientAppointment);
}

export interface CompanyFeedbackSummary {
  average: number | null;
  count: number;
  recent: Array<{
    id: number;
    client_name: string | null;
    rating: number;
    comment?: string | null;
    created_at: string | null;
  }>;
}

export async function clientFetchFeedbackSummary(companySlug: string): Promise<CompanyFeedbackSummary> {
  if (!companySlug) throw new Error("companySlug is required");
  return publicGet<CompanyFeedbackSummary>(
    `/api/companies/${encodeURIComponent(companySlug)}/feedback-summary`,
  );
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

export interface ClientAppointmentFeedbackPayload {
  service_rating: number;
  professional_rating: number;
  scheduling_rating: number;
  comment?: string;
  allow_public_testimonial?: boolean;
}

export async function clientEnviarFeedback(
  appointmentId: number,
  payload: ClientAppointmentFeedbackPayload,
  token: string,
): Promise<void> {
  await privateRequest(`/api/clients/appointments/${appointmentId}/feedback`, token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface PublicFeedbackAppointment {
  id: number;
  servico: string | null;
  data: string | null;
  horario: string | null;
  company?: {
    nome?: string;
    slug?: string;
  } | null;
  feedback?: AppointmentFeedback | null;
}

export async function fetchPublicFeedbackForm(token: string): Promise<PublicFeedbackAppointment> {
  if (!token) throw new Error("Token inválido");
  const result = await publicGet<PublicFeedbackAppointment>(`/api/feedback/form/${encodeURIComponent(token)}`);
  return result;
}

export async function submitPublicFeedback(
  token: string,
  payload: ClientAppointmentFeedbackPayload,
): Promise<PublicFeedbackAppointment> {
  if (!token) throw new Error("Token inválido");
  const response = await fetch(`${API_URL}/api/feedback/form/${encodeURIComponent(token)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Erro ao enviar feedback");
  }

  const payloadResponse = (await response.json()) as MaybeWrapped<PublicFeedbackAppointment>;
  return unwrap(payloadResponse);
}
