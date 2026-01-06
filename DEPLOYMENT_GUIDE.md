# Guía de Despliegue - Futbol SaaS

Esta guía te ayudará a subir tu aplicación a internet usando Vercel para el frontend y una plataforma para el backend.

## 📋 Estructura del Proyecto

- **Frontend**: Next.js (carpeta `web/`) → **Vercel**
- **Backend**: ASP.NET Core (carpeta `api/`) → **Railway/Render/Azure**

---

## 🚀 Parte 1: Desplegar el Backend (ASP.NET Core)

### Opción A: Railway (Recomendado - Más fácil)

1. **Crear cuenta en Railway**
   - Ve a https://railway.app
   - Regístrate con GitHub

2. **Crear nuevo proyecto**
   - Click en "New Project"
   - Selecciona "Deploy from GitHub repo"
   - Conecta tu repositorio

3. **Configurar el servicio**
   - Railway detectará automáticamente que es .NET
   - Si no, agrega un servicio y selecciona "Empty Service"
   - En la pestaña "Settings" → "Source":
     - Root Directory: `api/Futbol.Api`
     - Build Command: `dotnet publish -c Release -o /app`
     - Start Command: `dotnet Futbol.Api.dll`

4. **Configurar variables de entorno**
   - En "Variables" agrega:
     ```
     ASPNETCORE_ENVIRONMENT=Production
     ConnectionStrings__DefaultConnection=tu_connection_string_aqui
     Jwt__SecretKey=tu_secret_key_muy_largo_y_seguro
     Jwt__ExpiresMinutes=1440
     Cors__AllowedOrigins__0=https://tu-app.vercel.app
     ```

5. **Base de datos**
   - Railway ofrece PostgreSQL gratis
   - Agrega un servicio "PostgreSQL"
   - Copia la connection string y úsala en las variables de entorno
   - Actualiza `appsettings.json` para usar PostgreSQL

6. **Obtener la URL del backend**
   - Railway te dará una URL como: `https://tu-app.up.railway.app`
   - **Guarda esta URL**, la necesitarás para el frontend

### Opción B: Render

1. Ve a https://render.com
2. Crea una cuenta
3. "New" → "Web Service"
4. Conecta tu repositorio
5. Configuración:
   - **Name**: `futbol-api`
   - **Root Directory**: `api/Futbol.Api`
   - **Environment**: `dotnet`
   - **Build Command**: `dotnet publish -c Release -o ./publish`
   - **Start Command**: `dotnet ./publish/Futbol.Api.dll`
6. Agrega las mismas variables de entorno que en Railway
7. Obtén la URL del backend

---

## 🎨 Parte 2: Desplegar el Frontend (Next.js) en Vercel

### Paso 1: Preparar el repositorio

1. **Asegúrate de tener todo en GitHub**
   ```bash
   git add .
   git commit -m "Preparar para despliegue"
   git push origin main
   ```

### Paso 2: Crear cuenta en Vercel

1. Ve a https://vercel.com
2. Regístrate con GitHub (recomendado)
3. Autoriza a Vercel a acceder a tus repositorios

### Paso 3: Importar proyecto

1. En el dashboard de Vercel, click en **"Add New"** → **"Project"**
2. Selecciona tu repositorio de GitHub
3. Vercel detectará automáticamente que es Next.js

### Paso 4: Configurar el proyecto

1. **Root Directory**: 
   - Cambia a `web` (porque tu Next.js está en la carpeta `web/`)

2. **Framework Preset**: 
   - Debería detectar "Next.js" automáticamente

3. **Build Command**: 
   - `npm run build` (o `cd web && npm run build` si no funciona)

4. **Output Directory**: 
   - `.next` (dejar por defecto)

5. **Install Command**: 
   - `npm install` (o `cd web && npm install`)

### Paso 5: Variables de entorno

En la sección **"Environment Variables"**, agrega:

```
NEXT_PUBLIC_API_URL=https://tu-backend-url.railway.app
```

**⚠️ IMPORTANTE**: Reemplaza `https://tu-backend-url.railway.app` con la URL real de tu backend (la que obtuviste en la Parte 1).

### Paso 6: Desplegar

1. Click en **"Deploy"**
2. Espera a que termine el build (2-5 minutos)
3. ¡Listo! Vercel te dará una URL como: `https://tu-app.vercel.app`

---

## 🔧 Parte 3: Configurar CORS en el Backend

Una vez que tengas la URL de Vercel, actualiza el backend:

1. Ve a Railway/Render donde está tu backend
2. Edita las variables de entorno
3. Actualiza `Cors__AllowedOrigins__0` con tu URL de Vercel:
   ```
   Cors__AllowedOrigins__0=https://tu-app.vercel.app
   ```
4. Reinicia el servicio

---

## ✅ Verificación

1. **Frontend**: Abre `https://tu-app.vercel.app`
2. **Backend**: Prueba `https://tu-backend-url.railway.app/api/auth/login` (debería dar 400, no 404)
3. **Login**: Intenta iniciar sesión desde el frontend

---

## 🐛 Solución de Problemas

### Error: "Cannot connect to API"
- Verifica que `NEXT_PUBLIC_API_URL` esté configurado en Vercel
- Verifica que el backend esté corriendo
- Revisa los logs en Railway/Render

### Error CORS
- Asegúrate de que la URL de Vercel esté en `Cors__AllowedOrigins__0`
- Verifica que el backend tenga `AllowCredentials: true`

### Error de base de datos
- Verifica la connection string
- Asegúrate de que las migraciones se ejecuten (puedes hacerlo manualmente en Railway)

### Build falla en Vercel
- Verifica que `Root Directory` esté en `web`
- Revisa los logs de build en Vercel

---

## 📝 Notas Importantes

1. **Base de datos**: Si usas SQLite localmente, necesitarás cambiar a PostgreSQL/MySQL en producción
2. **HTTPS**: Tanto Vercel como Railway usan HTTPS automáticamente
3. **Variables de entorno**: Nunca subas `.env` al repositorio
4. **Actualizaciones**: Cada push a `main` desplegará automáticamente en Vercel

---

## 🔄 Actualizar después de cambios

1. Haz tus cambios en el código
2. `git push origin main`
3. Vercel desplegará automáticamente
4. Para el backend, Railway/Render también puede tener auto-deploy activado

---

## 💰 Costos

- **Vercel**: Gratis para proyectos personales
- **Railway**: $5/mes después del trial (o gratis con créditos)
- **Render**: Gratis con limitaciones (se suspende después de inactividad)

---

¿Necesitas ayuda? Revisa los logs en cada plataforma para ver errores específicos.

