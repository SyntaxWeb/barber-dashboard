import { resolveMediaUrl } from "@/lib/media";

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
