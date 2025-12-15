const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:4002";

const authHeaders = () => {
  const token = localStorage.getItem("barbeiro-token");
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
  const response = await fetch(`${API_URL}/api/notifications`, {
    headers: {
      Accept: "application/json",
      ...authHeaders(),
    },
  });

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
  const response = await fetch(`${API_URL}/api/notifications/${id}/read`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      ...authHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error("Não foi possível atualizar a notificação");
  }
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const response = await fetch(`${API_URL}/api/notifications/read-all`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      ...authHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error("Não foi possível atualizar as notificações");
  }
}
