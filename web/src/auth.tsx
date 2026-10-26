import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getToken, setToken, clearToken, getStoredUser, setStoredUser } from './api';

export type Role = 'owner' | 'ops' | 'cs' | 'content' | 'wh';
export interface User { id: number; username: string; name: string; role: Role; }

interface AuthCtx {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  setRole: (role: Role) => void;
}

const Ctx = createContext<AuthCtx>({ user: null, login: async () => {}, logout: () => {}, setRole: () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(getStoredUser());

  const login = async (username: string, password: string) => {
    const data = await api.post('/api/auth/login', { username, password });
    setToken(data.token);
    setStoredUser(data.user);
    setUser(data.user);
  };
  const logout = () => { clearToken(); setUser(null); location.href = '/login'; };
  const setRole = (role: Role) => {
    if (!user) return;
    const u = { ...user, role };
    setStoredUser(u); setUser(u);
  };

  return <Ctx.Provider value={{ user, login, logout, setRole }}>{children}</Ctx.Provider>;
}

export function useAuth() { return useContext(Ctx); }
