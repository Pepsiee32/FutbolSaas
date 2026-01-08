# ⚙️ Configurar Variables de Entorno en Render (CRÍTICO)

El error 500 indica que el backend está fallando porque **faltan variables de entorno** en Render.

## 🚨 Variables OBLIGATORIAS que debes configurar

### 1. Acceder a Render
1. Ve a: https://dashboard.render.com
2. Inicia sesión
3. Selecciona tu servicio `futbolsaas-1`

### 2. Ir a Environment Variables
1. En el menú lateral, haz clic en **"Environment"**
2. O busca la sección **"Environment Variables"**

### 3. Agregar estas variables (IMPORTANTE)

#### Variables de JWT (OBLIGATORIAS):
```
Nombre: Jwt__Key
Valor: PRODUCTION_CHANGE_ME_TO_A_SECURE_RANDOM_KEY_AT_LEAST_32_CHARACTERS_LONG
```

```
Nombre: Jwt__Issuer
Valor: Futbol.Api
```

```
Nombre: Jwt__Audience
Valor: Futbol.Web
```

```
Nombre: Jwt__ExpiresMinutes
Valor: 4320
```

#### Variables de CORS (OBLIGATORIAS):
```
Nombre: Cors__AllowedOrigins__0
Valor: http://localhost:3000
```

```
Nombre: Cors__AllowedOrigins__1
Valor: https://statsfutbolpro.vercel.app
```

```
Nombre: Cors__AllowedOrigins__2
Valor: https://futbol-saas-posta.vercel.app
```

#### Variable de Base de Datos (si no está):
```
Nombre: ConnectionStrings__DefaultConnection
Valor: Host=ep-calm-poetry-adpqicy6-pooler.c-2.us-east-1.aws.neon.tech;Database=neondb;Username=neondb_owner;Password=npg_TiHxNGv3a1hX;Port=5432;SSL Mode=Require;Trust Server Certificate=true
```

## 📋 Resumen de TODAS las Variables

Copia y pega estas en Render (una por una):

| Nombre | Valor |
|--------|-------|
| `Jwt__Key` | `PRODUCTION_CHANGE_ME_TO_A_SECURE_RANDOM_KEY_AT_LEAST_32_CHARACTERS_LONG` |
| `Jwt__Issuer` | `Futbol.Api` |
| `Jwt__Audience` | `Futbol.Web` |
| `Jwt__ExpiresMinutes` | `4320` |
| `Cors__AllowedOrigins__0` | `http://localhost:3000` |
| `Cors__AllowedOrigins__1` | `https://statsfutbolpro.vercel.app` |
| `Cors__AllowedOrigins__2` | `https://futbol-saas-posta.vercel.app` |
| `ConnectionStrings__DefaultConnection` | `Host=ep-calm-poetry-adpqicy6-pooler.c-2.us-east-1.aws.neon.tech;Database=neondb;Username=neondb_owner;Password=npg_TiHxNGv3a1hX;Port=5432;SSL Mode=Require;Trust Server Certificate=true` |

## ⚠️ IMPORTANTE

- Usa **doble guión bajo** (`__`) entre las palabras (ej: `Jwt__Key`, no `Jwt_Key`)
- **NO** uses espacios
- **NO** uses guiones simples (`-`)
- Para arrays, usa números: `__0`, `__1`, `__2`

## ✅ Después de Agregar las Variables

1. Haz clic en **"Save Changes"**
2. Render reiniciará automáticamente el servicio
3. Espera 2-5 minutos
4. Ve a "Logs" para verificar que no hay errores
5. Prueba el login desde Vercel

## 🔍 Verificar que Funciona

1. Ve a "Logs" en Render
2. Busca mensajes como:
   - ✅ "Application started"
   - ✅ "Now listening on"
   - ❌ Si ves errores, cópialos y revísalos

## 🆘 Si Aún Hay Errores

1. Verifica que todas las variables estén escritas **exactamente** como se muestra arriba
2. Verifica que no haya espacios extra
3. Revisa los logs de Render para ver el error específico
4. Asegúrate de que Render haya terminado de reiniciar (ve a "Events")
