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

  // Función interna que retorna el usuario para verificar éxito
  async function refreshInternal(): Promise<MeResponse | null> {
    try {
      const u = await auth.me();
      setMe(u);
      return u;
    } catch {
      setMe(null);
      return null;
    }
  }

  async function login(email: string, password: string) {
    await auth.login(email, password);
    
    // Detectar si es móvil para ajustar tiempos
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      typeof window !== 'undefined' ? navigator.userAgent : ''
    );
    
    // En móviles, esperar más tiempo para que la cookie esté disponible
    const initialDelay = isMobile ? 1000 : 300;
    await new Promise(resolve => setTimeout(resolve, initialDelay));
    
    // Intentar refresh, con más reintentos en móviles
    let attempts = 0;
    const maxAttempts = isMobile ? 5 : 3;
    let user = null;
    let lastError: Error | null = null;
    
    while (attempts < maxAttempts && !user) {
      try {
        user = await refreshInternal();
        if (user) break; // Si tenemos usuario, salir
        // Si no hay usuario, esperar más tiempo en móviles y reintentar
        const retryDelay = isMobile ? 1000 : 500;
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        attempts++;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        attempts++;
        if (attempts < maxAttempts) {
          const retryDelay = isMobile ? 1000 : 500;
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }
    
    // Si después de los reintentos aún no hay usuario, lanzar error con más contexto
    if (!user) {
      const errorMsg = lastError 
        ? `No se pudo verificar la sesión: ${lastError.message}. Por favor intenta nuevamente.`
        : "No se pudo verificar la sesión. Por favor intenta nuevamente.";
      throw new Error(errorMsg);
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
