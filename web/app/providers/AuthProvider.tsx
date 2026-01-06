"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, type MeResponse } from "@/services/auth";

type AuthState = {
  me: MeResponse | null;
  loading: boolean;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const u = await auth.me();
      setMe(u);
    } catch {
      setMe(null);
    }
  }

  async function login(email: string, password: string) {
    await auth.login(email, password);
    await refresh();
  }

  async function logout() {
    await auth.logout();
    setMe(null);
  }

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
  }, []);

  return (
    <Ctx.Provider value={{ me, loading, refresh, login, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return v;
}
