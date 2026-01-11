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

// Función helper para detectar si es un dispositivo móvil
function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

export async function api<T>(
  path: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  body?: unknown
): Promise<T> {
  // Obtener token de backup para móviles (fallback si la cookie no funciona)
  const backupToken = typeof window !== "undefined" 
    ? localStorage.getItem("auth_token_backup") 
    : null;

  const headers: HeadersInit = {};
  
  if (body) {
    headers["Content-Type"] = "application/json";
  }
  
  // Detectar si es móvil
  const isMobile = isMobileDevice();
  
  // En móviles, SIEMPRE usar el token del header si está disponible para endpoints protegidos
  // En desktop, usar el token como fallback si la cookie no funciona
  const isProtectedEndpoint = path.includes("/auth/me") || 
                              path.includes("/matches") || 
                              path.includes("/auth/logout");
  
  if (backupToken && isProtectedEndpoint) {
    // En móviles, priorizar el header sobre la cookie
    // En desktop, usar como fallback
    if (isMobile) {
      headers["Authorization"] = `Bearer ${backupToken}`;
      if (process.env.NODE_ENV === "development") {
        console.log(`[MÓVIL] Enviando token en header Authorization para ${path}`);
      }
    } else {
      // En desktop, solo usar como fallback si es necesario
      headers["Authorization"] = `Bearer ${backupToken}`;
      if (process.env.NODE_ENV === "development") {
        console.log(`[DESKTOP] Token disponible en header como fallback para ${path}`);
      }
    }
  } else if (isProtectedEndpoint && !backupToken && process.env.NODE_ENV === "development") {
    if (isMobile) {
      console.warn(`[MÓVIL] ⚠️ Intentando ${path} sin token de backup. La cookie puede no funcionar en móviles.`);
    } else {
      console.warn(`[DESKTOP] Intentando ${path} sin token de backup. Cookie debería funcionar.`);
    }
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: Object.keys(headers).length > 0 ? headers : undefined,
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

  // Obtener el texto de la respuesta
  const text = await res.text();
  
  // Si viene vacío (algunos endpoints como register pueden devolver 200 sin body)
  if (!text) {
    if (process.env.NODE_ENV === "development") {
      console.log(`Respuesta vacía de ${path}`);
    }
    return {} as T;
  }

  // Parsear JSON
  try {
    const parsed = JSON.parse(text) as T;
    if (process.env.NODE_ENV === "development" && path === "/auth/login") {
      console.log("Respuesta del login parseada:", parsed);
    }
    return parsed;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(`Error parseando respuesta de ${path}:`, error, "Texto:", text);
    }
    throw new Error(`Error al parsear respuesta: ${error}`);
  }
}
