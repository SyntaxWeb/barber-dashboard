import { secureStorage } from "@/lib/secureStorage";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:4002";

const authHeaders = () => {
  const token = secureStorage.getItem("barbeiro-token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const clientHeaders = () => {
  const token = secureStorage.getItem("cliente-token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Erro ao salvar perfil");
  }
  return (await response.json()) as T;
}

type ProviderProfilePayload = {
  name: string;
  email: string;
  telefone?: string;
  objetivo?: string;
  password?: string;
  password_confirmation?: string;
  avatar?: File | null;
};

type ClientProfilePayload = {
  name: string;
  email: string;
  telefone?: string;
  password?: string;
  password_confirmation?: string;
  avatar?: File | null;
};

const buildFormData = (payload: Record<string, FormDataEntryValue | undefined | null>) => {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value instanceof File) {
      formData.append(key, value);
      return;
    }
    if (typeof value === "string" || value instanceof Blob) {
      if (value !== "") {
        formData.append(key, value);
      }
    }
  });
  return formData;
};

export async function updateProviderProfile(payload: ProviderProfilePayload) {
  const formData = buildFormData({
    name: payload.name,
    email: payload.email,
    telefone: payload.telefone ?? "",
    objetivo: payload.objetivo ?? "",
    password: payload.password,
    password_confirmation: payload.password_confirmation,
    avatar: payload.avatar ?? undefined,
  });

  const response = await fetch(`${API_URL}/api/profile`, {
    method: "POST",
    headers: {
      ...authHeaders(),
    },
    body: formData,
  });

  return handleResponse(response);
}

export async function updateClientProfile(payload: ClientProfilePayload) {
  const formData = buildFormData({
    name: payload.name,
    email: payload.email,
    telefone: payload.telefone ?? "",
    password: payload.password,
    password_confirmation: payload.password_confirmation,
    avatar: payload.avatar ?? undefined,
  });

  const response = await fetch(`${API_URL}/api/clients/profile`, {
    method: "POST",
    headers: {
      ...clientHeaders(),
    },
    body: formData,
  });

  return handleResponse(response);
}
