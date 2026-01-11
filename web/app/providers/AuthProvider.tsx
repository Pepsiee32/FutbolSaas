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

  // Función helper para detectar Safari iOS
  function isSafariIOS(): boolean {
    if (typeof window === "undefined") return false;
    const ua = navigator.userAgent;
    return /iPhone|iPad|iPod/i.test(ua) && /Safari/i.test(ua) && !/CriOS|FxiOS|OPiOS/i.test(ua);
  }

  async function login(email: string, password: string) {
    // Detectar si es móvil y específicamente Safari iOS
    const isMobile = typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    const isIOS = isSafariIOS();
    
    if (process.env.NODE_ENV === "development") {
      console.log(`[LOGIN] Dispositivo: ${isMobile ? 'MÓVIL' : 'DESKTOP'}, Safari iOS: ${isIOS ? 'SÍ' : 'NO'}`);
    }
    
    try {
      // Hacer login - esto intentará guardar el token en localStorage si está disponible
      await auth.login(email, password);
    } catch (error) {
      // Si el login falla (error de red, credenciales incorrectas, etc.), re-lanzar
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Error al iniciar sesión: ${errorMessage}`);
    }
    
    // Verificar que el token se guardó correctamente
    const tokenGuardado = auth.getBackupToken();
    if (!tokenGuardado) {
      if (isIOS) {
        // En Safari iOS, el token es CRÍTICO porque las cookies no funcionan
        if (process.env.NODE_ENV === "development") {
          console.error("❌ [SAFARI iOS] CRÍTICO: Token no se guardó en localStorage. Las cookies no funcionan en Safari iOS.");
        }
        throw new Error("No se pudo guardar el token de autenticación. Por favor intenta nuevamente. Si el problema persiste, verifica que no estés en modo privado.");
      } else if (isMobile) {
        if (process.env.NODE_ENV === "development") {
          console.warn("⚠️ [MÓVIL] Token no se guardó en localStorage. La cookie puede no funcionar en móviles.");
        }
      } else {
        if (process.env.NODE_ENV === "development") {
          console.log("ℹ️ [DESKTOP] Token no disponible, pero la cookie debería funcionar.");
        }
      }
    } else {
      if (process.env.NODE_ENV === "development") {
        console.log("✅ Token guardado correctamente en localStorage");
      }
    }
    
    // En Safari iOS, usar el token del header inmediatamente (las cookies no funcionan)
    // En otros móviles, usar el token del header inmediatamente (no esperar a la cookie)
    // En desktop, dar un pequeño delay para que la cookie esté disponible
    const initialDelay = isIOS ? 100 : (isMobile ? 200 : 300); // Menos delay en Safari iOS
    await new Promise(resolve => setTimeout(resolve, initialDelay));
    
    // Intentar refresh, con más reintentos en Safari iOS y otros móviles
    let attempts = 0;
    const maxAttempts = isIOS ? 8 : (isMobile ? 6 : 3); // Más reintentos en Safari iOS
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
