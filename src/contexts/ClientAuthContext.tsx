import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { EmpresaInfo, fetchEmpresaPublic } from "@/services/companyService";
import { DEFAULT_CLIENT_THEME } from "@/lib/theme";
import { useTheme } from "./ThemeContext";
import { resolveMediaUrl } from "@/lib/media";

interface ClientUser {
  id?: number;
  name: string;
  email: string;
  telefone?: string | null;
  avatar_url?: string | null;
}

interface ClientAuthContextType {
  client: ClientUser | null;
  token: string | null;
  isAuthenticated: boolean;
  companySlug: string | null;
  companyInfo: EmpresaInfo | null;
  register: (payload: ClientRegisterPayload) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setCompanySlug: (slug: string | null, company?: EmpresaInfo | null) => void;
  updateClient: (payload: any) => void;
}

interface ClientRegisterPayload {
  name: string;
  email: string;
  telefone: string;
  password: string;
  password_confirmation: string;
}

const ClientAuthContext = createContext<ClientAuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:4002";
const STORAGE_USER = "cliente-user";
const STORAGE_TOKEN = "cliente-token";
const STORAGE_COMPANY = "cliente-company";

const normalizeClientUser = (data: any): ClientUser => ({
  id: data?.id,
  name: data?.name ?? "",
  email: data?.email ?? "",
  telefone: data?.telefone ?? null,
  avatar_url: resolveMediaUrl(data?.avatar_url),
});

export function ClientAuthProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<ClientUser | null>(() => {
    const stored = localStorage.getItem(STORAGE_USER);
    return stored ? normalizeClientUser(JSON.parse(stored)) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_TOKEN));
  const [companySlug, setCompanySlugState] = useState<string | null>(() => localStorage.getItem(STORAGE_COMPANY));
  const [companyInfo, setCompanyInfo] = useState<EmpresaInfo | null>(null);
  const { setPalette, activatePalette } = useTheme();

  const persistSession = (userPayload: any, jwt: string) => {
    const normalized = normalizeClientUser(userPayload);
    setClient(normalized);
    setToken(jwt);
    localStorage.setItem(STORAGE_USER, JSON.stringify(normalized));
    localStorage.setItem(STORAGE_TOKEN, jwt);
  };

  const applyClientUpdate = (payload: any) => {
    const normalized = normalizeClientUser(payload);
    setClient(normalized);
    localStorage.setItem(STORAGE_USER, JSON.stringify(normalized));
  };

  const persistCompanySlug = (slug: string | null, info?: EmpresaInfo | null) => {
    setCompanySlugState(slug);
    if (slug) {
      localStorage.setItem(STORAGE_COMPANY, slug);
    } else {
      localStorage.removeItem(STORAGE_COMPANY);
    }
    if (info) {
      setCompanyInfo(info);
      setPalette("client", info.client_theme);
      activatePalette("client");
    } else if (!slug) {
      setCompanyInfo(null);
      setPalette("client", DEFAULT_CLIENT_THEME);
      activatePalette("dashboard");
    }
  };

  const register = async (payload: ClientRegisterPayload): Promise<boolean> => {
    const response = await fetch(`${API_URL}/api/clients/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) return false;

    const data = await response.json();
    if (!data.token || !data.user) return false;

    persistSession(data.user, data.token);
    return true;
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    const response = await fetch(`${API_URL}/api/clients/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    if (!data.token || !data.user) return false;

    persistSession(data.user, data.token);
    return true;
  };

  const logout = () => {
    setClient(null);
    setToken(null);
    localStorage.removeItem(STORAGE_USER);
    localStorage.removeItem(STORAGE_TOKEN);
  };

  useEffect(() => {
    if (!companySlug) {
      setCompanyInfo(null);
      setPalette("client", DEFAULT_CLIENT_THEME);
      activatePalette("dashboard");
      return;
    }

    if (companyInfo?.slug === companySlug) {
      activatePalette("client");
      return;
    }

    let cancelled = false;
    fetchEmpresaPublic(companySlug)
      .then((info) => {
        if (cancelled) return;
        setCompanyInfo(info);
        setPalette("client", info.client_theme);
        activatePalette("client");
      })
      .catch(() => {
        if (cancelled) return;
        setCompanyInfo(null);
      });

    return () => {
      cancelled = true;
    };
  }, [companySlug, companyInfo?.slug, setPalette, activatePalette]);

  return (
    <ClientAuthContext.Provider
      value={{
        client,
        token,
        isAuthenticated: !!client && !!token,
        companySlug,
        companyInfo,
        register,
        login,
        logout,
        setCompanySlug: persistCompanySlug,
        updateClient: applyClientUpdate,
      }}
    >
      {children}
    </ClientAuthContext.Provider>
  );
}

export function useClientAuth() {
  const context = useContext(ClientAuthContext);
  if (!context) {
    throw new Error("useClientAuth must be used within a ClientAuthProvider");
  }
  return context;
}
