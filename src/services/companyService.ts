import { resolveMediaUrl } from "@/lib/media";
import { BrandTheme, DEFAULT_CLIENT_THEME, DEFAULT_DASHBOARD_THEME, sanitizeTheme } from "@/lib/theme";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:4002";

const authHeaders = () => {
  const token = localStorage.getItem("barbeiro-token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export interface EmpresaInfo {
  id: number;
  nome: string;
  descricao?: string | null;
  slug: string;
  agendamento_url: string;
  icon_url?: string | null;
  notify_email?: string | null;
  notify_telegram?: string | null;
  notify_via_email?: boolean;
  notify_via_telegram?: boolean;
  dashboard_theme: BrandTheme;
  client_theme: BrandTheme;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Erro na requisição");
  }
  return (await response.json()) as T;
}

const normalizeEmpresa = (empresa: EmpresaInfo): EmpresaInfo => ({
  ...empresa,
  icon_url: resolveMediaUrl(empresa.icon_url),
  dashboard_theme: sanitizeTheme(empresa.dashboard_theme, DEFAULT_DASHBOARD_THEME),
  client_theme: sanitizeTheme(empresa.client_theme, DEFAULT_CLIENT_THEME),
});

export async function fetchEmpresa(): Promise<EmpresaInfo> {
  const response = await fetch(`${API_URL}/api/company`, {
    headers: {
      Accept: "application/json",
      ...authHeaders(),
    },
  });

  const data = await handleResponse<EmpresaInfo>(response);
  return normalizeEmpresa(data);
}

export async function fetchEmpresaPublic(slug: string): Promise<EmpresaInfo> {
  if (!slug) {
    throw new Error("slug is required");
  }

  const response = await fetch(`${API_URL}/api/companies/${encodeURIComponent(slug)}`, {
    headers: {
      Accept: "application/json",
    },
  });

  const data = await handleResponse<EmpresaInfo>(response);
  return normalizeEmpresa(data);
}

interface UpdateEmpresaPayload {
  nome: string;
  descricao?: string;
  icone?: File | null;
  notify_email?: string | null;
  notify_telegram?: string | null;
  notify_via_email?: boolean;
  notify_via_telegram?: boolean;
  dashboard_theme?: BrandTheme;
  client_theme?: BrandTheme;
}

export async function updateEmpresa(payload: UpdateEmpresaPayload): Promise<EmpresaInfo> {
  const formData = new FormData();
  formData.append("nome", payload.nome);
  if (payload.descricao !== undefined) {
    formData.append("descricao", payload.descricao);
  }
  if (payload.icone) {
    formData.append("icone", payload.icone);
  }
  if (payload.notify_email !== undefined) {
    formData.append("notify_email", payload.notify_email ?? "");
  }
  if (payload.notify_telegram !== undefined) {
    formData.append("notify_telegram", payload.notify_telegram ?? "");
  }
  if (payload.notify_via_email !== undefined) {
    formData.append("notify_via_email", String(payload.notify_via_email));
  }
  if (payload.notify_via_telegram !== undefined) {
    formData.append("notify_via_telegram", String(payload.notify_via_telegram));
  }
  if (payload.dashboard_theme) {
    Object.entries(payload.dashboard_theme).forEach(([key, value]) => {
      formData.append(`dashboard_theme[${key}]`, value);
    });
  }
  if (payload.client_theme) {
    Object.entries(payload.client_theme).forEach(([key, value]) => {
      formData.append(`client_theme[${key}]`, value);
    });
  }

  const response = await fetch(`${API_URL}/api/company`, {
    method: "POST",
    headers: {
      ...authHeaders(),
    },
    body: formData,
  });

  const data = await handleResponse<EmpresaInfo>(response);
  return normalizeEmpresa(data);
}

export async function requestTelegramLink(): Promise<{ link: string }> {
  const response = await fetch(`${API_URL}/api/company/telegram/link`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      ...authHeaders(),
    },
  });

  return handleResponse<{ link: string }>(response);
}

export async function verifyTelegramLink(): Promise<{ chat_id: string }> {
  const response = await fetch(`${API_URL}/api/company/telegram/link/verify`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      ...authHeaders(),
    },
  });

  return handleResponse<{ chat_id: string }>(response);
}
