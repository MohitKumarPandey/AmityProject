import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, signup as apiSignup, getMe } from '../api/client';
import type { User } from '../types/observation';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('citypulse_token'));
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const resp = await getMe();
      setUser(resp.data);
    } catch {
      localStorage.removeItem('citypulse_token');
      setToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    if (token) {
      loadUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token, loadUser]);

  const login = async (email: string, password: string) => {
    const resp = await apiLogin(email, password);
    const t = resp.data.access_token;
    localStorage.setItem('citypulse_token', t);
    setToken(t);
    await loadUser();
  };

  const signup = async (email: string, password: string, fullName: string) => {
    await apiSignup(email, password, fullName);
    await login(email, password);
  };

  const logout = () => {
    localStorage.removeItem('citypulse_token');
    setToken(null);
    setUser(null);
  };

  const loginWithGoogle = async (credential: string) => {
    const { loginWithGoogle: apiLoginGoogle } = await import('../api/client');
    const resp = await apiLoginGoogle(credential);
    const t = resp.data.access_token;
    localStorage.setItem('citypulse_token', t);
    setToken(t);
    await loadUser();
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, loginWithGoogle, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
