import { createContext, useContext, useState, ReactNode } from "react";

interface ClientUser {
  name: string;
  email: string;
  telefone?: string;
}

interface ClientAuthContextType {
  client: ClientUser | null;
  token: string | null;
  isAuthenticated: boolean;
  companySlug: string | null;
  register: (payload: ClientRegisterPayload) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setCompanySlug: (slug: string | null) => void;
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

export function ClientAuthProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<ClientUser | null>(() => {
    const stored = localStorage.getItem(STORAGE_USER);
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_TOKEN));
  const [companySlug, setCompanySlugState] = useState<string | null>(() => localStorage.getItem(STORAGE_COMPANY));

  const persistSession = (user: ClientUser, jwt: string) => {
    setClient(user);
    setToken(jwt);
    localStorage.setItem(STORAGE_USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_TOKEN, jwt);
  };

  const persistCompanySlug = (slug: string | null) => {
    setCompanySlugState(slug);
    if (slug) {
      localStorage.setItem(STORAGE_COMPANY, slug);
    } else {
      localStorage.removeItem(STORAGE_COMPANY);
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

  return (
    <ClientAuthContext.Provider
      value={{
        client,
        token,
        isAuthenticated: !!client && !!token,
        companySlug,
        register,
        login,
        logout,
        setCompanySlug: persistCompanySlug,
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
