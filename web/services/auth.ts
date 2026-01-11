import { api } from "./api";

export type MeResponse = { id: string; email: string };
export type LoginResponse = { token: string };

const TOKEN_STORAGE_KEY = "auth_token_backup";

export const auth = {
  register: (email: string, password: string) =>
    api<void>("/auth/register", "POST", { email, password }),

  login: async (email: string, password: string): Promise<void> => {
    const response = await api<LoginResponse>("/auth/login", "POST", { email, password });
    // Almacenar token como fallback para móviles (especialmente Safari iOS)
    // CRÍTICO: Guardar inmediatamente para que esté disponible en la siguiente petición
    if (response && "token" in response && response.token && typeof window !== "undefined") {
      try {
        localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
        if (process.env.NODE_ENV === "development") {
          console.log("✅ Token almacenado en localStorage como backup:", response.token.substring(0, 20) + "...");
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
        console.warn("⚠️ No se recibió token en la respuesta del login", response);
      }
      // Si no hay token, puede que la cookie funcione, pero es mejor tener ambos
      throw new Error("No se recibió token de autenticación. Por favor intenta nuevamente.");
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
