import { Agendamento, Servico, ConfiguracoesBarbearia } from "@/data/mockData";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:4002";

const authHeaders = () => {
  const token = localStorage.getItem("barbeiro-token");
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
  preco: number;
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
    body: JSON.stringify(servico),
  });
}

export async function updateServico(id: number, dados: Partial<Servico>): Promise<Servico> {
  return api<Servico>(`/api/services/${id}`, {
    method: "PUT",
    body: JSON.stringify(dados),
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
  }>("/api/settings");

  return {
    horarioInicio: data.horarioInicio,
    horarioFim: data.horarioFim,
    intervaloMinutos: data.intervaloMinutos,
    diasBloqueados: data.diasBloqueados,
  };
}

export async function updateConfiguracoes(config: Partial<ConfiguracoesBarbearia>): Promise<ConfiguracoesBarbearia> {
  const payload: Record<string, unknown> = {
    horario_inicio: config.horarioInicio,
    horario_fim: config.horarioFim,
    intervalo_minutos: config.intervaloMinutos,
    dias_bloqueados: config.diasBloqueados,
  };

  const data = await api<{
    horarioInicio: string;
    horarioFim: string;
    intervaloMinutos: number;
    diasBloqueados: string[];
  }>("/api/settings", {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  return {
    horarioInicio: data.horarioInicio,
    horarioFim: data.horarioFim,
    intervaloMinutos: data.intervaloMinutos,
    diasBloqueados: data.diasBloqueados,
  };
}

// ========== HELPERS ==========

export async function fetchHorariosDisponiveis(data: string): Promise<string[]> {
  const result = await api<{ horarios: string[] }>(`/api/availability?date=${data}`);
  return result.horarios;
}

export function formatarData(data: string): string {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

export function formatarPreco(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
