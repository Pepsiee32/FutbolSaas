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
      
      // Almacenar token como fallback para móviles (especialmente Safari iOS)
      // CRÍTICO: Guardar inmediatamente para que esté disponible en la siguiente petición
      if (response && typeof response === "object" && "token" in response) {
        const token = (response as any).token;
        if (token && typeof token === "string" && token.trim().length > 0) {
          try {
            localStorage.setItem(TOKEN_STORAGE_KEY, token);
            if (process.env.NODE_ENV === "development") {
              console.log("✅ Token almacenado en localStorage como backup:", token.substring(0, 20) + "...");
            }
          } catch (error) {
            // Si localStorage no está disponible (modo privado, etc.), loguear el error
            if (process.env.NODE_ENV === "development") {
              console.error("❌ Error al guardar token en localStorage:", error);
            }
            // No lanzar error aquí, la cookie puede funcionar
          }
        } else {
          if (process.env.NODE_ENV === "development") {
            console.warn("⚠️ Token recibido pero está vacío o inválido:", token);
          }
          // No lanzar error aquí, la cookie puede funcionar en desktop
        }
      } else {
        if (process.env.NODE_ENV === "development") {
          console.warn("⚠️ No se recibió token en la respuesta del login. Respuesta:", response);
          console.warn("⚠️ Esto puede ser normal si la cookie funciona correctamente.");
        }
        // NO lanzar error aquí - la cookie puede funcionar
        // El error se lanzará en AuthProvider si la verificación de sesión falla
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
