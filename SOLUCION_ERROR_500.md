# 🔴 Solución al Error 500 en Render

El error **500 (Internal Server Error)** significa que el backend en Render está fallando al procesar la petición.

## 🔍 Causa Más Probable

**Faltan variables de entorno en Render**, especialmente las de JWT.

## ✅ Solución Rápida

### Opción 1: Configurar Variables en Render (5 minutos)

1. Ve a: https://dashboard.render.com
2. Selecciona tu servicio `futbolsaas-1`
3. Ve a **"Environment"** (menú lateral)
4. Agrega estas variables **UNA POR UNA**:

```
Jwt__Key = PRODUCTION_CHANGE_ME_TO_A_SECURE_RANDOM_KEY_AT_LEAST_32_CHARACTERS_LONG
```

```
Jwt__Issuer = Futbol.Api
```

```
Jwt__Audience = Futbol.Web
```

```
Jwt__ExpiresMinutes = 4320
```

```
Cors__AllowedOrigins__0 = http://localhost:3000
```

```
Cors__AllowedOrigins__1 = https://statsfutbolpro.vercel.app
```

```
Cors__AllowedOrigins__2 = https://futbol-saas-posta.vercel.app
```

5. **Guarda** los cambios
6. Render reiniciará automáticamente
7. Espera 2-5 minutos
8. Prueba el login nuevamente

### Opción 2: Verificar Logs de Render

Para ver el error exacto:

1. Ve a Render dashboard
2. Selecciona `futbolsaas-1`
3. Ve a la pestaña **"Logs"**
4. Busca errores en rojo
5. Cópialos y compártelos para diagnosticar mejor

## 📋 Variables Mínimas Necesarias

Si solo quieres que funcione rápido, agrega al menos estas **3 variables críticas**:

1. `Jwt__Key` = `PRODUCTION_CHANGE_ME_TO_A_SECURE_RANDOM_KEY_AT_LEAST_32_CHARACTERS_LONG`
2. `Cors__AllowedOrigins__1` = `https://statsfutbolpro.vercel.app`
3. `ConnectionStrings__DefaultConnection` = (tu connection string de Neon)

## ⚠️ Importante

- Usa **doble guión bajo** (`__`), no guión simple
- **NO** uses espacios extra
- Los valores deben ser **exactos**

## 🔄 Después de Configurar

1. Ve a "Events" en Render para ver el progreso del reinicio
2. Espera hasta que veas "Deploy successful" o "Live"
3. Prueba el login desde Vercel
4. Si aún falla, revisa los "Logs" para ver el error específico
