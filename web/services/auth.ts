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
    if (response && "token" in response && response.token && typeof window !== "undefined") {
      localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
      if (process.env.NODE_ENV === "development") {
        console.log("Token almacenado en localStorage como backup");
      }
    } else {
      if (process.env.NODE_ENV === "development") {
        console.warn("No se recibió token en la respuesta del login", response);
      }
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
