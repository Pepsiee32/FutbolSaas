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
      return u; // Retornar el usuario para verificar éxito
    } catch {
      setMe(null);
      return null;
    }
  }

  async function login(email: string, password: string) {
    await auth.login(email, password);
    // Esperar un momento para que la cookie esté disponible
    await new Promise(resolve => setTimeout(resolve, 300));
    // Intentar refresh, con reintentos si falla
    let attempts = 0;
    const maxAttempts = 3;
    let user = null;
    
    while (attempts < maxAttempts && !user) {
      try {
        user = await refresh();
        if (user) break; // Si tenemos usuario, salir
        // Si no hay usuario, esperar un poco más y reintentar
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      } catch {
        attempts++;
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }
    
    // Si después de los reintentos aún no hay usuario, lanzar error
    if (!user) {
      throw new Error("No se pudo verificar la sesión. Por favor intenta nuevamente.");
    }
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
