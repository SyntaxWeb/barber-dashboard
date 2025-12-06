import { createContext, useContext, useState, ReactNode } from 'react';
import { barbeiroMock } from '@/data/mockData';

interface User {
  nome: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, senha: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('barbeiro-user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (email: string, _senha: string): Promise<boolean> => {
    // Mock login - aceita qualquer senha com email válido
    if (email && email.includes('@')) {
      const userData = { ...barbeiroMock, email };
      setUser(userData);
      localStorage.setItem('barbeiro-user', JSON.stringify(userData));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('barbeiro-user');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
