// web/services/matches.ts
import { api } from "./api";

export type Match = {
  id: string;
  date: string; // ISO
  opponent: string | null;
  format: number | null;
  goals: number | null;
  assists: number | null;
  result: number | null;     // 1 win, 0 draw, -1 loss
  isMvp: boolean;
  notes: string | null;
};

export type CreateMatchRequest = {
  date: string; // ISO
  opponent?: string | null;
  format?: number | null;
  goals?: number | null;
  assists?: number | null;
  result: number | null;
  isMvp: boolean;
  notes?: string | null;
};

export type UpdateMatchRequest = CreateMatchRequest;

export const matchesApi = {
  list: () => api<Match[]>("/matches", "GET"),
  get: (id: string) => api<Match>(`/matches/${id}`, "GET"),
  create: (req: CreateMatchRequest) => api<Match>("/matches", "POST", req),
  update: (id: string, req: CreateMatchRequest) =>
    api<Match>(`/matches/${id}`, "PUT", req),
  remove: (id: string) => api<void>(`/matches/${id}`, "DELETE"),
};


// Helpers UI (texto)
export function resultLabel(result: number | null | undefined) {
  if (result === 1) return "Ganado";
  if (result === 0) return "Empatado";
  if (result === -1) return "Perdido";
  return "Sin resultado";
}
