import { api } from "./api";

export type MeResponse = { id: string; email: string };
export type LoginResponse = { token: string };

const TOKEN_STORAGE_KEY = "auth_token_backup";

export const auth = {
  register: (email: string, password: string) =>
    api<void>("/auth/register", "POST", { email, password }),

  login: async (email: string, password: string): Promise<void> => {
    try {
      const response = await api<LoginResponse>("/auth/login", "POST", { email, password });
      
      if (process.env.NODE_ENV === "development") {
        console.log("🔍 Respuesta completa del login:", response);
      }
      
      // Detectar Safari iOS
      const isSafariIOS = typeof window !== "undefined" && 
        /iPhone|iPad|iPod/i.test(navigator.userAgent) && 
        /Safari/i.test(navigator.userAgent) && 
        !/CriOS|FxiOS|OPiOS/i.test(navigator.userAgent);
      
      // Logging siempre activo para Safari iOS
      if (isSafariIOS) {
        console.log("[SAFARI iOS] 🔍 Respuesta del login recibida:", response);
        console.log("[SAFARI iOS] Tipo de respuesta:", typeof response);
        console.log("[SAFARI iOS] Es null/undefined?:", response === null || response === undefined);
        console.log("[SAFARI iOS] Es objeto?:", response && typeof response === "object");
        console.log("[SAFARI iOS] Tiene propiedad 'token':", response && typeof response === "object" && "token" in response);
        if (response && typeof response === "object") {
          console.log("[SAFARI iOS] Propiedades del objeto:", Object.keys(response));
          console.log("[SAFARI iOS] Contenido completo:", JSON.stringify(response));
        }
      }
      
      // Almacenar token como fallback para móviles (especialmente Safari iOS)
      // CRÍTICO: Guardar inmediatamente para que esté disponible en la siguiente petición
      if (response && typeof response === "object" && "token" in response) {
        const token = (response as any).token;
        if (isSafariIOS) {
          console.log("[SAFARI iOS] Token recibido:", token ? `${token.substring(0, 30)}...` : "VACÍO");
          console.log("[SAFARI iOS] Token es string:", typeof token === "string");
          console.log("[SAFARI iOS] Token tiene longitud:", token ? token.length : 0);
        }
        
        if (token && typeof token === "string" && token.trim().length > 0) {
          try {
            localStorage.setItem(TOKEN_STORAGE_KEY, token);
            // Logging siempre activo para Safari iOS
            if (isSafariIOS) {
              console.log("✅ [SAFARI iOS] Token almacenado en localStorage:", token.substring(0, 30) + "...");
              // Verificar que se guardó correctamente
              const verificado = localStorage.getItem(TOKEN_STORAGE_KEY);
              console.log("✅ [SAFARI iOS] Token verificado en localStorage:", verificado ? "OK" : "FALLO");
            } else if (process.env.NODE_ENV === "development") {
              console.log("✅ Token almacenado en localStorage como backup:", token.substring(0, 20) + "...");
            }
          } catch (error) {
            // Si localStorage no está disponible (modo privado en Safari iOS, etc.)
            if (isSafariIOS) {
              // En Safari iOS, el token es CRÍTICO porque las cookies no funcionan
              if (process.env.NODE_ENV === "development") {
                console.error("❌ [SAFARI iOS] Error crítico al guardar token en localStorage:", error);
                console.error("❌ [SAFARI iOS] Esto puede ser porque estás en modo privado. Las cookies tampoco funcionan en Safari iOS.");
              }
              throw new Error("No se pudo guardar el token de autenticación. Por favor desactiva el modo privado o intenta en otro navegador.");
            } else {
              // En otros navegadores, la cookie puede funcionar
              if (process.env.NODE_ENV === "development") {
                console.error("❌ Error al guardar token en localStorage:", error);
                console.warn("⚠️ La cookie puede funcionar como alternativa.");
              }
            }
          }
        } else {
          if (isSafariIOS) {
            // En Safari iOS, sin token es crítico
            if (process.env.NODE_ENV === "development") {
              console.error("❌ [SAFARI iOS] Token recibido pero está vacío o inválido:", token);
            }
            throw new Error("No se recibió un token de autenticación válido. Por favor intenta nuevamente.");
          } else {
            if (process.env.NODE_ENV === "development") {
              console.warn("⚠️ Token recibido pero está vacío o inválido:", token);
            }
            // No lanzar error aquí, la cookie puede funcionar en desktop
          }
        }
      } else {
        if (isSafariIOS) {
          // En Safari iOS, sin token es crítico - logging siempre activo
          console.error("❌ [SAFARI iOS] No se recibió token en la respuesta del login.");
          console.error("❌ [SAFARI iOS] Respuesta completa:", response);
          console.error("❌ [SAFARI iOS] Tipo de respuesta:", typeof response);
          console.error("❌ [SAFARI iOS] Es null?:", response === null);
          console.error("❌ [SAFARI iOS] Es undefined?:", response === undefined);
          console.error("❌ [SAFARI iOS] Es objeto?:", response && typeof response === "object");
          if (response && typeof response === "object") {
            console.error("❌ [SAFARI iOS] Propiedades disponibles:", Object.keys(response));
            console.error("❌ [SAFARI iOS] JSON stringificado:", JSON.stringify(response));
          }
          throw new Error("No se recibió token de autenticación. Las cookies no funcionan en Safari iOS. Por favor intenta nuevamente.");
        } else {
          if (process.env.NODE_ENV === "development") {
            console.warn("⚠️ No se recibió token en la respuesta del login. Respuesta:", response);
            console.warn("⚠️ Esto puede ser normal si la cookie funciona correctamente.");
          }
          // NO lanzar error aquí - la cookie puede funcionar
          // El error se lanzará en AuthProvider si la verificación de sesión falla
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("❌ Error en login:", error);
      }
      // Re-lanzar el error para que AuthProvider lo maneje
      throw error;
    }
  },

  me: () => api<MeResponse>("/auth/me", "GET"),

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
    return api<void>("/auth/logout", "POST");
  },

  getBackupToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  },
};
