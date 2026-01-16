import { secureStorage } from "@/lib/secureStorage";
import { BrandTheme, DEFAULT_CLIENT_THEME, DEFAULT_DASHBOARD_THEME, sanitizeTheme } from "@/lib/theme";
import { apiFetch, handleResponse } from "@/services/api";

const authHeaders = () => {
  const token = secureStorage.getItem("barbeiro-token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export interface EmpresaInfo {
  id: number;
  nome: string;
  descricao?: string | null;
  slug: string;
  agendamento_url: string;
  icon_url?: string | null;
  gallery_photos?: string[] | null;
  notify_email?: string | null;
  notify_telegram?: string | null;
  notify_whatsapp?: string | null;
  notify_via_email?: boolean;
  notify_via_telegram?: boolean;
  notify_via_whatsapp?: boolean;
  whatsapp_session_id?: string | null;
  whatsapp_status?: string | null;
  whatsapp_phone?: string | null;
  whatsapp_connected_at?: string | null;
  dashboard_theme: BrandTheme;
  client_theme: BrandTheme;
}

const normalizeEmpresa = (empresa: EmpresaInfo): EmpresaInfo => {
  const galleryPhotos = Array.isArray(empresa.gallery_photos)
    ? empresa.gallery_photos
        .map((photo) => photo ?? photo)
        .filter((photo): photo is string => Boolean(photo))
    : [];

  return {
    ...empresa,
    icon_url: empresa.icon_url ?? empresa.icon_url,
    gallery_photos: galleryPhotos,
    dashboard_theme: sanitizeTheme(empresa.dashboard_theme, DEFAULT_DASHBOARD_THEME),
    client_theme: sanitizeTheme(empresa.client_theme, DEFAULT_CLIENT_THEME),
  };
};

export async function fetchEmpresa(): Promise<EmpresaInfo> {
  const response = await apiFetch(
    "/api/company",
    {
    headers: {
      Accept: "application/json",
      ...authHeaders(),
    },
    },
    "provider",
  );

  const data = await handleResponse<EmpresaInfo>(response, "Erro na requisição");
  return normalizeEmpresa(data);
}

export async function fetchEmpresaPublic(slug: string): Promise<EmpresaInfo> {
  if (!slug) {
    throw new Error("slug is required");
  }

  const response = await apiFetch(`/api/companies/${encodeURIComponent(slug)}`, {
    headers: {
      Accept: "application/json",
    },
  });

  const data = await handleResponse<EmpresaInfo>(response, "Erro na requisição");
  return normalizeEmpresa(data);
}

interface UpdateEmpresaPayload {
  nome: string;
  descricao?: string;
  icone?: File | null;
  notify_email?: string | null;
  notify_telegram?: string | null;
  notify_whatsapp?: string | null;
  notify_via_email?: boolean;
  notify_via_telegram?: boolean;
  notify_via_whatsapp?: boolean;
  dashboard_theme?: BrandTheme;
  client_theme?: BrandTheme;
  gallery_photos?: File[];
  gallery_remove?: string[];
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
  if (payload.notify_whatsapp !== undefined) {
    formData.append("notify_whatsapp", payload.notify_whatsapp ?? "");
  }
  if (payload.notify_via_email !== undefined) {
    formData.append("notify_via_email", String(payload.notify_via_email));
  }
  if (payload.notify_via_telegram !== undefined) {
    formData.append("notify_via_telegram", String(payload.notify_via_telegram));
  }
  if (payload.notify_via_whatsapp !== undefined) {
    formData.append("notify_via_whatsapp", String(payload.notify_via_whatsapp));
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
  if (payload.gallery_photos?.length) {
    payload.gallery_photos.forEach((file) => {
      formData.append("gallery_photos[]", file);
    });
  }
  if (payload.gallery_remove?.length) {
    payload.gallery_remove.forEach((photo) => {
      formData.append("gallery_remove[]", photo);
    });
  }

  const response = await apiFetch(
    "/api/company",
    {
      method: "POST",
      headers: {
        ...authHeaders(),
      },
      body: formData,
    },
    "provider",
  );

  const data = await handleResponse<EmpresaInfo>(response, "Erro na requisição");
  return normalizeEmpresa(data);
}

export async function requestTelegramLink(): Promise<{ link: string }> {
  const response = await apiFetch(
    "/api/company/telegram/link",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        ...authHeaders(),
      },
    },
    "provider",
  );

  return handleResponse<{ link: string }>(response, "Erro na requisição");
}

export async function verifyTelegramLink(): Promise<{ chat_id: string }> {
  const response = await apiFetch(
    "/api/company/telegram/link/verify",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        ...authHeaders(),
      },
    },
    "provider",
  );

  return handleResponse<{ chat_id: string }>(response, "Erro na requisição");
}
