import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as apiLogin } from '../api/auth';

export type Role = 'admin' | 'resident' | 'doorman' | 'superadmin';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  apartment_id: string | null;
  apartment_number: string | null;
}

interface AuthCtx {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthCtx>({} as AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    const res: any = await apiLogin(email, password);
    const { access_token, user: u } = res.data;
    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
  };

  const signOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
