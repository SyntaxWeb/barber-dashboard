import { safeLocalStorage } from "@/lib/localStorage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { resolveMediaUrl } from "@/lib/media";
import { BrandTheme, DEFAULT_CLIENT_THEME, DEFAULT_DASHBOARD_THEME } from "@/lib/theme";
import { useTheme } from "./ThemeContext";
import { secureStorage } from "@/lib/secureStorage";
import { apiFetch } from "@/services/api";

interface CompanyInfo {
  id?: number;
  nome?: string;
  slug?: string;
  agendamento_url?: string;
  descricao?: string | null;
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
  dashboard_theme?: BrandTheme;
  client_theme?: BrandTheme;
  subscription_plan?: string | null;
  subscription_status?: string | null;
  subscription_price?: string | null;
  subscription_renews_at?: string | null;
}

interface User {
  id?: number;
  nome: string;
  email: string;
  role?: string;
  companyId?: number;
  company?: CompanyInfo | null;
  telefone?: string | null;
  objetivo?: string | null;
  avatar_url?: string | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (email: string, senha: string) => Promise<boolean>;
  logout: () => void;
  updateCompany: (company: CompanyInfo | null) => void;
  updateUser: (data: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || "https://api-atendimento.syntaxatendimento.com.br";
const normalizeCompany = (company?: CompanyInfo | null): CompanyInfo | null => {
  if (!company) return null;
  const galleryPhotos = Array.isArray(company.gallery_photos)
    ? company.gallery_photos
        .map((photo) => resolveMediaUrl(photo))
        .filter((photo): photo is string => Boolean(photo))
    : [];
  return {
    ...company,
    icon_url: resolveMediaUrl(company.icon_url),
    gallery_photos: galleryPhotos,
    dashboard_theme: DEFAULT_DASHBOARD_THEME,
    client_theme: DEFAULT_CLIENT_THEME,
    subscription_status: company.subscription_status ?? "pendente",
    subscription_plan: company.subscription_plan ?? "mensal",
  };
};

const normalizeUser = (payload: any): User => {
  if (!payload) {
    return {
      nome: "",
      email: "",
    };
  }

  return {
    id: payload.id,
    nome: payload.nome ?? payload.name ?? "",
    email: payload.email ?? "",
    role: payload.role ?? payload.tipo ?? "provider",
    telefone: payload.telefone ?? null,
    objetivo: payload.objetivo ?? null,
    companyId: payload.company_id ?? payload.companyId,
    company: normalizeCompany(payload.company ?? payload.companyInfo ?? null),
    avatar_url: resolveMediaUrl(payload.avatar_url),
  };
};

const getStoredUser = (): User | null => {
  const stored = safeLocalStorage.getItem("barbeiro-user");
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored);
    return normalizeUser(parsed);
  } catch {
    return null;
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [token, setToken] = useState<string | null>(() => secureStorage.getItem("barbeiro-token"));
  const { setPalette } = useTheme();
  useEffect(() => {
    setPalette("dashboard", DEFAULT_DASHBOARD_THEME);
    setPalette("client", DEFAULT_CLIENT_THEME);
  }, [setPalette]);

  const persistUser = useCallback((payload: any, authToken?: string | null) => {
    const normalizedUser = normalizeUser(payload);
    setUser((currentUser) =>
      JSON.stringify(currentUser) === JSON.stringify(normalizedUser) ? currentUser : normalizedUser,
    );
    safeLocalStorage.setItem(
      "barbeiro-user",
      JSON.stringify({
        ...payload,
        role: normalizedUser.role,
        company: normalizedUser.company,
        avatar_url: normalizedUser.avatar_url,
      }),
    );
    if (authToken) {
      setToken(authToken);
      secureStorage.setItem("barbeiro-token", authToken);
    }
  }, []);

  const login = useCallback(async (email: string, _senha: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password: _senha }),
      });

      if (!response.ok) return false;

      const data = await response.json();

      if (!data.token || !data.user) return false;

      persistUser(data.user, data.token);
      setPalette("dashboard", DEFAULT_DASHBOARD_THEME);
      setPalette("client", DEFAULT_CLIENT_THEME);
      return true;
    } catch {
      return false;
    }
  }, [persistUser, setPalette]);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    safeLocalStorage.removeItem("barbeiro-user");
    secureStorage.removeItem("barbeiro-token");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ scope?: string; token?: string }>).detail;
      if (detail?.scope && detail.scope !== "provider" && detail.scope !== "any") return;
      if (detail?.token && detail.token !== token) return;
      logout();
    };
    window.addEventListener("auth:expired", handler);
    return () => window.removeEventListener("auth:expired", handler);
  }, [logout, token]);

  const updateCompany = useCallback((company: CompanyInfo | null) => {
    const normalized = normalizeCompany(company);
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, company: normalized };
      safeLocalStorage.setItem("barbeiro-user", JSON.stringify(updated));
      return JSON.stringify(prev) === JSON.stringify(updated) ? prev : updated;
    });
    setPalette("dashboard", DEFAULT_DASHBOARD_THEME);
    setPalette("client", DEFAULT_CLIENT_THEME);
  }, [setPalette]);

  const updateUser = useCallback(
    (payload: any) => {
      persistUser(payload, token ?? null);
    },
    [persistUser, token],
  );

  useEffect(() => {
    if (!token || typeof document === "undefined") return;
    let cancelled = false;
    let fetching = false;
    let lastAttempt = 0;
    const controller = new AbortController();
    const validate = async () => {
      if (cancelled || fetching || document.visibilityState === "hidden") return;
      if (lastAttempt && Date.now() - lastAttempt < 30000) return;
      lastAttempt = Date.now();
      fetching = true;
      try {
        const response = await apiFetch(
          "/api/me",
          {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          },
          "provider",
        );
        if (!response.ok || cancelled) return;
        const payload = await response.json();
        if (!cancelled) updateUser(payload);
      } catch {
        // Keep the current session during network failures or cancellation.
      } finally {
        fetching = false;
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void validate();
      }
    };

    void validate();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      cancelled = true;
      controller.abort();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [token, updateUser]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      token,
      login,
      logout,
      updateCompany,
      updateUser,
    }),
    [user, token, login, logout, updateCompany, updateUser],
  );

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
