import { secureStorage } from "@/lib/secureStorage";
import { apiFetch } from "@/services/api";

const authHeaders = () => {
  const token = secureStorage.getItem("barbeiro-token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export interface AppNotification {
  id: string;
  data: {
    appointment_id: number;
    cliente: string;
    telefone: string;
    data: string;
    horario: string;
    service?: string;
    preco?: number;
    action?: string;
    company?: {
      id?: number;
      nome?: string;
      slug?: string;
    };
  };
  read_at: string | null;
  created_at: string;
}

export async function fetchNotifications(): Promise<AppNotification[]> {
  const response = await apiFetch(
    "/api/notifications",
    {
      headers: {
        Accept: "application/json",
        ...authHeaders(),
      },
    },
    "provider",
  );

  if (!response.ok) {
    throw new Error("Não foi possível carregar as notificações");
  }

  const payload = await response.json();
  if (Array.isArray(payload)) {
    return payload as AppNotification[];
  }
  return (payload.data ?? []) as AppNotification[];
}

export async function markNotificationAsRead(id: string): Promise<void> {
  const response = await apiFetch(
    `/api/notifications/${id}/read`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        ...authHeaders(),
      },
    },
    "provider",
  );

  if (!response.ok) {
    throw new Error("Não foi possível atualizar a notificação");
  }
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const response = await apiFetch(
    "/api/notifications/read-all",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        ...authHeaders(),
      },
    },
    "provider",
  );

  if (!response.ok) {
    throw new Error("Não foi possível atualizar as notificações");
  }
}
