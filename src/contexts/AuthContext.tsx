import { createContext, useContext, useState, ReactNode } from "react";
import { resolveMediaUrl } from "@/lib/media";

interface CompanyInfo {
  id?: number;
  nome?: string;
  slug?: string;
  agendamento_url?: string;
  descricao?: string | null;
  icon_url?: string | null;
}

interface User {
  nome: string;
  email: string;
  companyId?: number;
  company?: CompanyInfo | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (email: string, senha: string) => Promise<boolean>;
  logout: () => void;
  updateCompany: (company: CompanyInfo | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:4002";
const normalizeCompany = (company?: CompanyInfo | null): CompanyInfo | null => {
  if (!company) return null;
  return {
    ...company,
    icon_url: resolveMediaUrl(company.icon_url),
  };
};

const getStoredUser = (): User | null => {
  const stored = localStorage.getItem("barbeiro-user");
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored) as User;
    return {
      ...parsed,
      company: normalizeCompany(parsed.company ?? null),
    };
  } catch {
    return null;
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("barbeiro-token"));

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

      const normalizedUser: User = {
        nome: data.user.nome ?? data.user.name ?? "",
        email: data.user.email ?? "",
        companyId: data.user.company_id ?? data.user.companyId,
        company: normalizeCompany(data.user.company ?? null),
      };

      setUser(normalizedUser);
      setToken(data.token);
      localStorage.setItem("barbeiro-user", JSON.stringify(normalizedUser));
      localStorage.setItem("barbeiro-token", data.token);
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("barbeiro-user");
    localStorage.removeItem("barbeiro-token");
  };

  const updateCompany = (company: CompanyInfo | null) => {
    const normalized = normalizeCompany(company);
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, company: normalized };
      localStorage.setItem("barbeiro-user", JSON.stringify(updated));
      return updated;
    });
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
