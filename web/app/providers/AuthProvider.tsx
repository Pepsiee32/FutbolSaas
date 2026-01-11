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
      if (process.env.NODE_ENV === "development") {
        console.log("refreshInternal exitoso:", u);
      }
      return u;
    } catch (error) {
      setMe(null);
      if (process.env.NODE_ENV === "development") {
        console.error("refreshInternal falló:", error);
      }
      return null;
    }
  }

  async function login(email: string, password: string) {
    // Detectar si es móvil para ajustar estrategia
    const isMobile = typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    
    if (process.env.NODE_ENV === "development") {
      console.log(`[LOGIN] Dispositivo: ${isMobile ? 'MÓVIL' : 'DESKTOP'}`);
    }
    
    // Hacer login - esto guardará el token en localStorage
    await auth.login(email, password);
    
    // Verificar que el token se guardó correctamente
    const tokenGuardado = auth.getBackupToken();
    if (!tokenGuardado && isMobile) {
      if (process.env.NODE_ENV === "development") {
        console.warn("⚠️ [MÓVIL] Token no se guardó en localStorage. La cookie puede no funcionar.");
      }
    }
    
    // En móviles, usar el token del header inmediatamente (no esperar a la cookie)
    // En desktop, dar un pequeño delay para que la cookie esté disponible
    const initialDelay = isMobile ? 200 : 300; // Menos delay en móviles porque usamos header
    await new Promise(resolve => setTimeout(resolve, initialDelay));
    
    // Intentar refresh, con más reintentos en móviles
    let attempts = 0;
    const maxAttempts = isMobile ? 6 : 3; // Más reintentos en móviles
    let user = null;
    let lastError: Error | null = null;
    
    while (attempts < maxAttempts && !user) {
      try {
        user = await refreshInternal();
        if (user) {
          if (process.env.NODE_ENV === "development") {
            console.log(`✅ [LOGIN] Sesión verificada exitosamente en intento ${attempts + 1}`);
          }
          break; // Si tenemos usuario, salir
        }
        // Si no hay usuario, esperar más tiempo en móviles y reintentar
        const retryDelay = isMobile ? 800 : 500;
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        attempts++;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (process.env.NODE_ENV === "development") {
          console.error(`❌ [LOGIN] Intento ${attempts + 1} falló:`, error);
        }
        attempts++;
        if (attempts < maxAttempts) {
          const retryDelay = isMobile ? 800 : 500;
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }
    
    // Si después de los reintentos aún no hay usuario, lanzar error con más contexto
    if (!user) {
      const tokenInfo = tokenGuardado ? "Token disponible" : "Token no disponible";
      const errorMsg = lastError 
        ? `No se pudo verificar la sesión después de ${maxAttempts} intentos. ${tokenInfo}. Error: ${lastError.message}. Por favor intenta nuevamente.`
        : `No se pudo verificar la sesión después de ${maxAttempts} intentos. ${tokenInfo}. Por favor intenta nuevamente.`;
      
      if (process.env.NODE_ENV === "development") {
        console.error(`❌ [LOGIN] Falló después de ${maxAttempts} intentos. Token: ${tokenInfo}`);
      }
      
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
