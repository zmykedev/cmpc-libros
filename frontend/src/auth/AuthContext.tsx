import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authApi } from '../api/books';
import { TOKEN_KEY } from '../api/client';

interface AuthState {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { accessToken } = await authApi.login(email, password);
    localStorage.setItem(TOKEN_KEY, accessToken);
    setToken(accessToken);
  }, []);

  // El cliente HTTP emite este evento cuando la API responde 401 (token expirado).
  useEffect(() => {
    window.addEventListener('auth:logout', logout);
    return () => window.removeEventListener('auth:logout', logout);
  }, [logout]);

  const value = useMemo(() => ({ isAuthenticated: !!token, login, logout }), [token, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
