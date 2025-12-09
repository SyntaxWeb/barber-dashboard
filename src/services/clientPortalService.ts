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
  const response = await fetch(`${API_URL}/api/appointments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      ...payload,
      company_slug: companySlug,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Erro ao criar agendamento.");
  }
}
