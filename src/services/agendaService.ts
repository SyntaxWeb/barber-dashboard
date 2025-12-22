import { Agendamento, Servico, ConfiguracoesBarbearia } from "@/data/mockData";
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
  return unwrap<T>(payload);
}

// ========== AGENDAMENTOS ==========

export async function fetchAgendamentos(): Promise<Agendamento[]> {
  return api<Agendamento[]>("/api/appointments");
}

export async function fetchAgendamentosPorData(data: string): Promise<Agendamento[]> {
  return api<Agendamento[]>(`/api/appointments?date=${data}`);
}

export async function fetchAgendamentosPorPeriodo(dataInicio: string, dataFim: string): Promise<Agendamento[]> {
  return api<Agendamento[]>(`/api/appointments?from=${dataInicio}&to=${dataFim}`);
}

type AppointmentPayload = {
  cliente: string;
  telefone: string;
  data: string;
  horario: string;
  service_id: number;
  preco?: number;
  observacoes?: string;
};

export async function createAgendamento(payload: AppointmentPayload): Promise<Agendamento> {
  return api<Agendamento>("/api/appointments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAgendamento(id: number, payload: AppointmentPayload): Promise<Agendamento> {
  return api<Agendamento>(`/api/appointments/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function cancelarAgendamento(id: number): Promise<boolean> {
  await api(`/api/appointments/${id}/status`, {
    method: "POST",
    body: JSON.stringify({ status: "cancelado" }),
  });
  return true;
}

export async function concluirAgendamento(id: number): Promise<boolean> {
  await api(`/api/appointments/${id}/status`, {
    method: "POST",
    body: JSON.stringify({ status: "concluido" }),
  });
  return true;
}

// ========== SERVIÇOS ==========

export async function fetchServicos(): Promise<Servico[]> {
  return api<Servico[]>("/api/services");
}

export async function createServico(servico: Omit<Servico, "id">): Promise<Servico> {
  return api<Servico>("/api/services", {
    method: "POST",
    body: JSON.stringify({
      nome: servico.nome,
      preco: servico.preco,
      duracao_minutos: servico.duracao,
    }),
  });
}

export async function updateServico(id: number, dados: Partial<Servico>): Promise<Servico> {
  const payload: Record<string, unknown> = {};
  if (dados.nome !== undefined) payload.nome = dados.nome;
  if (dados.preco !== undefined) payload.preco = dados.preco;
  if (dados.duracao !== undefined) payload.duracao_minutos = dados.duracao;

  return api<Servico>(`/api/services/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteServico(id: number): Promise<boolean> {
  await api(`/api/services/${id}`, { method: "DELETE" });
  return true;
}

// ========== CONFIGURAÇÕES ==========

export async function fetchConfiguracoes(): Promise<ConfiguracoesBarbearia> {
  const data = await api<{
    horarioInicio: string;
    horarioFim: string;
    intervaloMinutos: number;
    diasBloqueados: string[];
    weeklySchedule?: Record<
      string,
      { enabled: boolean; start: string; end: string; lunch_enabled?: boolean; lunch_start?: string | null; lunch_end?: string | null }
    >;
  }>("/api/settings");

  const weeklySchedule =
    data.weeklySchedule &&
    Object.entries(data.weeklySchedule).reduce((acc, [key, value]) => {
      acc[key] = {
        enabled: value.enabled,
        start: value.start,
        end: value.end,
        lunchEnabled: value.lunch_enabled ?? false,
        lunchStart: value.lunch_start ?? null,
        lunchEnd: value.lunch_end ?? null,
      };
      return acc;
    }, {} as ConfiguracoesBarbearia["weeklySchedule"]);

  return {
    horarioInicio: data.horarioInicio,
    horarioFim: data.horarioFim,
    intervaloMinutos: data.intervaloMinutos,
    diasBloqueados: data.diasBloqueados,
    weeklySchedule: weeklySchedule ?? null,
  };
}

export async function updateConfiguracoes(config: Partial<ConfiguracoesBarbearia>): Promise<ConfiguracoesBarbearia> {
  const payload: Record<string, unknown> = {
    horario_inicio: config.horarioInicio,
    horario_fim: config.horarioFim,
    intervalo_minutos: config.intervaloMinutos,
    dias_bloqueados: config.diasBloqueados,
  };
  if (config.weeklySchedule) {
    payload.weekly_schedule = Object.entries(config.weeklySchedule).reduce((acc, [key, value]) => {
      acc[key] = {
        enabled: value.enabled,
        start: value.start,
        end: value.end,
        lunch_enabled: value.lunchEnabled,
        lunch_start: value.lunchStart,
        lunch_end: value.lunchEnd,
      };
      return acc;
    }, {} as Record<string, unknown>);
  }

  const data = await api<{
    horarioInicio: string;
    horarioFim: string;
    intervaloMinutos: number;
    diasBloqueados: string[];
    weeklySchedule?: Record<
      string,
      { enabled: boolean; start: string; end: string; lunch_enabled?: boolean; lunch_start?: string | null; lunch_end?: string | null }
    >;
  }>("/api/settings", {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  const weeklySchedule =
    data.weeklySchedule &&
    Object.entries(data.weeklySchedule).reduce((acc, [key, value]) => {
      acc[key] = {
        enabled: value.enabled,
        start: value.start,
        end: value.end,
        lunchEnabled: value.lunch_enabled ?? false,
        lunchStart: value.lunch_start ?? null,
        lunchEnd: value.lunch_end ?? null,
      };
      return acc;
    }, {} as ConfiguracoesBarbearia["weeklySchedule"]);

  return {
    horarioInicio: data.horarioInicio,
    horarioFim: data.horarioFim,
    intervaloMinutos: data.intervaloMinutos,
    diasBloqueados: data.diasBloqueados,
    weeklySchedule: weeklySchedule ?? null,
  };
}

// ========== HELPERS ==========

export async function fetchHorariosDisponiveis(
  data: string,
  serviceId?: number,
  appointmentId?: number,
): Promise<string[]> {
  const params = new URLSearchParams({ date: data });
  if (serviceId) {
    params.set("service_id", serviceId.toString());
  }
  if (appointmentId) {
    params.set("appointment_id", appointmentId.toString());
  }
  const result = await api<{ horarios: string[] }>(`/api/availability?${params.toString()}`);
  return result.horarios;
}

export function formatarData(data: string): string {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

export function formatarPreco(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
