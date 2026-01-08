# 🔍 Verificar que el Backend Funcione

## Paso 1: Verificar que Render esté Respondiendo

Abre en tu navegador (o usa curl):

```
https://futbolsaas-1.onrender.com/ping
```

**Debería responder**: `"ok"`

Si no responde o da error, el backend no está funcionando.

## Paso 2: Verificar la URL en Vercel

El frontend necesita tener configurada la variable de entorno `NEXT_PUBLIC_API_URL` en Vercel.

### Verificar en Vercel:

1. Ve a: https://vercel.com
2. Selecciona tu proyecto `statsfutbolpro`
3. Ve a **"Settings"** → **"Environment Variables"**
4. Busca `NEXT_PUBLIC_API_URL`
5. Debe tener el valor: `https://futbolsaas-1.onrender.com`

### Si no existe o está mal:

1. Agrega o edita la variable:
   - **Nombre**: `NEXT_PUBLIC_API_URL`
   - **Valor**: `https://futbolsaas-1.onrender.com`
2. Selecciona los ambientes: **Production**, **Preview**, **Development**
3. Guarda
4. **Redesplega** el proyecto (Vercel debería hacerlo automáticamente)

## Paso 3: Verificar que el Backend Esté Activo

En Render:

1. Ve a: https://dashboard.render.com
2. Selecciona `futbolsaas-1`
3. Verifica el estado:
   - Debe decir **"Live"** o **"Running"**
   - Si dice **"Stopped"** o **"Error"**, hay un problema

## Paso 4: Probar el Endpoint de Login Directamente

Abre la consola del navegador (F12) y ejecuta:

```javascript
fetch('https://futbolsaas-1.onrender.com/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@test.com', password: 'test123' }),
  credentials: 'include'
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

Esto te mostrará el error exacto que está devolviendo el backend.

## 🔧 Solución Rápida

Si el backend no responde en `/ping`:

1. Ve a Render → `futbolsaas-1` → **"Events"**
2. Verifica si hay errores de despliegue
3. Si hay errores, compártelos para diagnosticar
