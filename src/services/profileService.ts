import { secureStorage } from "@/lib/secureStorage";
import { apiFetch, handleResponse } from "@/services/api";

const authHeaders = () => {
  const token = secureStorage.getItem("barbeiro-token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const clientHeaders = () => {
  const token = secureStorage.getItem("cliente-token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

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

  const response = await apiFetch(
    "/api/profile",
    {
    method: "POST",
    headers: {
      ...authHeaders(),
    },
    body: formData,
    },
    "provider",
  );

  return handleResponse(response, "Erro ao salvar perfil");
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

  const response = await apiFetch(
    "/api/clients/profile",
    {
    method: "POST",
    headers: {
      ...clientHeaders(),
    },
    body: formData,
    },
    "client",
  );

  return handleResponse(response, "Erro ao salvar perfil");
}
