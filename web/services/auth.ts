import { api } from "./api";

export type MeResponse = { id: string; email: string };

export const auth = {
  register: (email: string, password: string) =>
    api<void>("/auth/register", "POST", { email, password }),

  login: (email: string, password: string) =>
    api<void>("/auth/login", "POST", { email, password }),

  me: () => api<MeResponse>("/auth/me", "GET"),

  logout: () => api<void>("/auth/logout", "POST"),
};
