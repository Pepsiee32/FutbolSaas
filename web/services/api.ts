// web/services/api.ts
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5247";

type ApiErrorBody = 
  | { message?: string; error?: string }
  | { errors?: Array<{ code?: string; description?: string }> }
  | Array<{ code?: string; description?: string }>;

function parseErrorMessage(data: ApiErrorBody): string {
  // Si es un array de errores (Identity errors)
  if (Array.isArray(data)) {
    const messages = data
      .map((err) => {
        const desc = err.description || err.code || "";
        // Traducir códigos comunes de Identity a mensajes amigables
        if (desc.includes("PasswordRequiresDigit") || err.code === "PasswordRequiresDigit") {
          return "La contraseña debe contener al menos un número";
        }
        if (desc.includes("PasswordRequiresUpper") || err.code === "PasswordRequiresUpper") {
          return "La contraseña debe contener al menos una mayúscula";
        }
        if (desc.includes("PasswordRequiresLower") || err.code === "PasswordRequiresLower") {
          return "La contraseña debe contener al menos una minúscula";
        }
        if (desc.includes("PasswordTooShort") || err.code === "PasswordTooShort") {
          return "La contraseña es demasiado corta";
        }
        if (desc.includes("DuplicateUserName") || err.code === "DuplicateUserName") {
          return "Este email ya está registrado";
        }
        if (desc.includes("InvalidEmail") || err.code === "InvalidEmail") {
          return "El email no es válido";
        }
        return desc || err.code || "Error de validación";
      })
      .filter((msg) => msg);
    return messages.join(". ");
  }

  // Si es un objeto con errors array
  if (typeof data === "object" && "errors" in data && Array.isArray(data.errors)) {
    return parseErrorMessage(data.errors);
  }

  // Si tiene message o error
  if (typeof data === "object" && ("message" in data || "error" in data)) {
    return (data as { message?: string; error?: string }).message || 
           (data as { message?: string; error?: string }).error || 
           "Error desconocido";
  }

  return "Error desconocido";
}

export async function api<T>(
  path: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  body?: unknown
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include", // IMPORTANT: manda/recibe cookie auth_token
  });

  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const data = (await res.json()) as ApiErrorBody;
      detail = parseErrorMessage(data);
    } catch {
      // Si no se puede parsear, usar el status
      if (res.status === 400) {
        detail = "Solicitud inválida. Verifica los datos ingresados.";
      } else if (res.status === 401) {
        detail = "No autorizado. Verifica tus credenciales.";
      } else if (res.status === 403) {
        detail = "Acceso denegado.";
      } else if (res.status === 404) {
        detail = "Recurso no encontrado.";
      } else if (res.status >= 500) {
        detail = "Error del servidor. Intenta más tarde.";
      }
    }
    throw new Error(detail);
  }

  // Si viene vacío (login/register devuelven 200 sin body)
  const text = await res.text();
  if (!text) return {} as T;

  return JSON.parse(text) as T;
}
