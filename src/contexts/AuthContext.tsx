import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { resolveMediaUrl } from "@/lib/media";
import { BrandTheme, DEFAULT_CLIENT_THEME, DEFAULT_DASHBOARD_THEME, sanitizeTheme } from "@/lib/theme";
import { useTheme } from "./ThemeContext";
import { secureStorage } from "@/lib/secureStorage";

interface CompanyInfo {
  id?: number;
  nome?: string;
  slug?: string;
  agendamento_url?: string;
  descricao?: string | null;
  icon_url?: string | null;
  notify_email?: string | null;
  notify_telegram?: string | null;
  notify_via_email?: boolean;
  notify_via_telegram?: boolean;
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

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:4002";
const normalizeCompany = (company?: CompanyInfo | null): CompanyInfo | null => {
  if (!company) return null;
  const dashboardTheme = sanitizeTheme(company.dashboard_theme, DEFAULT_DASHBOARD_THEME);
  const clientTheme = sanitizeTheme(company.client_theme, DEFAULT_CLIENT_THEME);
  return {
    ...company,
    icon_url: resolveMediaUrl(company.icon_url),
    dashboard_theme: dashboardTheme,
    client_theme: clientTheme,
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
  const stored = localStorage.getItem("barbeiro-user");
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
  const { setPalette, activatePalette } = useTheme();
  const dashboardThemeKey = JSON.stringify(user?.company?.dashboard_theme);

  useEffect(() => {
    if (user?.company?.dashboard_theme) {
      setPalette("dashboard", user.company.dashboard_theme);
    } else {
      setPalette("dashboard", DEFAULT_DASHBOARD_THEME);
    }
  }, [dashboardThemeKey, setPalette]);

  useEffect(() => {
    if (user) {
      activatePalette("dashboard");
    }
  }, [user, activatePalette]);

  const persistUser = (payload: any, authToken?: string | null) => {
    const normalizedUser = normalizeUser(payload);
    setUser(normalizedUser);
    localStorage.setItem(
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
  };

  const login = async (email: string, _senha: string): Promise<boolean> => {
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
      if (data.user.company?.dashboard_theme) {
        setPalette("dashboard", data.user.company.dashboard_theme);
      }
      if (data.user.company?.client_theme) {
        setPalette("client", data.user.company.client_theme);
      }
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("barbeiro-user");
    secureStorage.removeItem("barbeiro-token");
  };

  const updateCompany = (company: CompanyInfo | null) => {
    const normalized = normalizeCompany(company);
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, company: normalized };
      localStorage.setItem("barbeiro-user", JSON.stringify(updated));
      return updated;
    });
    if (normalized?.dashboard_theme) {
      setPalette("dashboard", normalized.dashboard_theme);
    }
    if (normalized?.client_theme) {
      setPalette("client", normalized.client_theme);
    }
  };

  const updateUser = (payload: any) => {
    persistUser(payload, token ?? null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        token,
        login,
        logout,
        updateCompany,
        updateUser,
      }}
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
