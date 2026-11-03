import { safeLocalStorage } from "@/lib/localStorage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { EmpresaInfo, fetchEmpresaPublic } from "@/services/companyService";
import { resolveMediaUrl } from "@/lib/media";
import { DEFAULT_CLIENT_THEME } from "@/lib/theme";
import { useTheme } from "./ThemeContext";
import { secureStorage } from "@/lib/secureStorage";
import { apiFetch } from "@/services/api";

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
  register: (payload: ClientRegisterPayload, companySlugOverride?: string) => Promise<boolean>;
  login: (email: string, password: string, companySlugOverride?: string) => Promise<boolean>;
  loginWithGoogle: (credential: string, companySlugOverride?: string) => Promise<boolean>;
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

const API_URL = import.meta.env.VITE_API_URL || "https://api-atendimento.syntaxatendimento.com.br";
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
  const initialToken = secureStorage.getItem(STORAGE_TOKEN);
  const [client, setClient] = useState<ClientUser | null>(() => {
    const stored = safeLocalStorage.getItem(STORAGE_USER);
    try { return stored && initialToken ? normalizeClientUser(JSON.parse(stored)) : null; } catch { return null; }
  });
  const [token, setToken] = useState<string | null>(initialToken);
  const [companySlug, setCompanySlugState] = useState<string | null>(() => safeLocalStorage.getItem(STORAGE_COMPANY));
  const [companyInfo, setCompanyInfo] = useState<EmpresaInfo | null>(null);
  const { setPalette } = useTheme();

  const persistSession = useCallback((userPayload: any, jwt: string) => {
    const normalized = normalizeClientUser(userPayload);
    setClient((current) =>
      JSON.stringify(current) === JSON.stringify(normalized) ? current : normalized,
    );
    setToken(jwt);
    safeLocalStorage.setItem(STORAGE_USER, JSON.stringify(normalized));
    secureStorage.setItem(STORAGE_TOKEN, jwt);
  }, []);

  const applyClientUpdate = useCallback((payload: any) => {
    const normalized = normalizeClientUser(payload);
    setClient((current) =>
      JSON.stringify(current) === JSON.stringify(normalized) ? current : normalized,
    );
    safeLocalStorage.setItem(STORAGE_USER, JSON.stringify(normalized));
  }, []);

  const persistCompanySlug = useCallback((slug: string | null, info?: EmpresaInfo | null) => {
    setCompanySlugState(slug);
    if (slug) {
      safeLocalStorage.setItem(STORAGE_COMPANY, slug);
    } else {
      safeLocalStorage.removeItem(STORAGE_COMPANY);
    }
    if (info) {
      setCompanyInfo(info);
      setPalette("client", DEFAULT_CLIENT_THEME);

    } else if (!slug) {
      setCompanyInfo(null);
      setPalette("client", DEFAULT_CLIENT_THEME);

    }
  }, [setPalette]);

  const resolveCompanyForAuth = useCallback((override?: string): string | null => override ?? companySlug, [companySlug]);

  const register = useCallback(async (payload: ClientRegisterPayload, overrideSlug?: string): Promise<boolean> => {
    const targetSlug = resolveCompanyForAuth(overrideSlug);

    const response = await fetch(`${API_URL}/api/clients/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...payload,
        company_slug: targetSlug ?? undefined,
      }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    if (!data.token || !data.user) return false;

    persistSession(data.user, data.token);
    if (targetSlug) persistCompanySlug(targetSlug);
    return true;
  }, [persistCompanySlug, persistSession, resolveCompanyForAuth]);

  const login = useCallback(async (email: string, password: string, overrideSlug?: string): Promise<boolean> => {
    const targetSlug = resolveCompanyForAuth(overrideSlug);

    const response = await fetch(`${API_URL}/api/clients/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, company_slug: targetSlug ?? undefined }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    if (!data.token || !data.user) return false;

    persistSession(data.user, data.token);
    if (targetSlug) persistCompanySlug(targetSlug);
    return true;
  }, [persistCompanySlug, persistSession, resolveCompanyForAuth]);

  const loginWithGoogle = useCallback(async (credential: string, overrideSlug?: string): Promise<boolean> => {
    const targetSlug = resolveCompanyForAuth(overrideSlug);

    const response = await fetch(`${API_URL}/api/clients/login/google`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ credential, company_slug: targetSlug ?? undefined }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    if (!data.token || !data.user) return false;

    persistSession(data.user, data.token);
    if (targetSlug) persistCompanySlug(targetSlug);
    return true;
  }, [persistCompanySlug, persistSession, resolveCompanyForAuth]);

  const logout = useCallback(() => {
    setClient(null);
    setToken(null);
    safeLocalStorage.removeItem(STORAGE_USER);
    secureStorage.removeItem(STORAGE_TOKEN);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ scope?: string; token?: string }>).detail;
      if (detail?.scope && detail.scope !== "client" && detail.scope !== "any") return;
      if (detail?.token && detail.token !== token) return;
      logout();
    };
    window.addEventListener("auth:expired", handler);
    return () => window.removeEventListener("auth:expired", handler);
  }, [logout, token]);

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
          "/api/clients/me",
          {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          },
          "client",
        );
        if (!response.ok || cancelled) return;
        const payload = await response.json();
        if (!cancelled) applyClientUpdate(payload);
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
  }, [token, applyClientUpdate]);

  useEffect(() => {
    if (!token && client) {
      setClient(null);
      safeLocalStorage.removeItem(STORAGE_USER);
    }
  }, [token, client]);

  useEffect(() => {
    if (!companySlug) {
      setCompanyInfo(null);
      setPalette("client", DEFAULT_CLIENT_THEME);

      return;
    }

    if (companyInfo?.slug === companySlug) {

      return;
    }

    let cancelled = false;
    fetchEmpresaPublic(companySlug)
      .then((info) => {
        if (cancelled) return;
        setCompanyInfo(info);
        setPalette("client", DEFAULT_CLIENT_THEME);

      })
      .catch(() => {
        if (cancelled) return;
        setCompanyInfo(null);
      });

    return () => {
      cancelled = true;
    };
  }, [companySlug, companyInfo?.slug, setPalette]);

  const value = useMemo(
    () => ({
      client,
      token,
      isAuthenticated: !!client && !!token,
      companySlug,
      companyInfo,
      register,
      login,
      loginWithGoogle,
      logout,
      setCompanySlug: persistCompanySlug,
      updateClient: applyClientUpdate,
    }),
    [
      client,
      token,
      companySlug,
      companyInfo,
      register,
      login,
      loginWithGoogle,
      logout,
      persistCompanySlug,
      applyClientUpdate,
    ],
  );

  return (
    <ClientAuthContext.Provider
      value={value}
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
