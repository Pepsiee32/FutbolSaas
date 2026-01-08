# 🧪 Test Rápido del Backend

## Verificar que Render esté Funcionando

### Test 1: Endpoint Ping (Más Simple)

Abre en tu navegador:
```
https://futbolsaas-1.onrender.com/ping
```

**Resultado esperado**: Debe mostrar `"ok"` en texto plano

### Test 2: Desde la Consola del Navegador

Abre la consola (F12) en `https://statsfutbolpro.vercel.app` y ejecuta:

```javascript
// Test 1: Ping
fetch('https://futbolsaas-1.onrender.com/ping')
  .then(r => r.text())
  .then(console.log)
  .catch(console.error)

// Test 2: Login (debería dar 500 con mensaje de error ahora)
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

## 🔍 Qué Buscar

### Si `/ping` funciona pero `/auth/login` da 500:
- El backend está corriendo
- El problema está en el código del login
- El mensaje de error ahora debería aparecer en la respuesta

### Si `/ping` NO funciona:
- El backend no está corriendo o está caído
- Ve a Render y verifica el estado del servicio

### Si ambos fallan con CORS:
- CORS no está configurado correctamente
- Verifica las variables de entorno en Render

## 📋 Verificar Variables en Vercel

El frontend necesita tener en Vercel:

1. Ve a: https://vercel.com
2. Tu proyecto → Settings → Environment Variables
3. Verifica que exista:
   - `NEXT_PUBLIC_API_URL` = `https://futbolsaas-1.onrender.com`

Si no existe, agrégalo y redesplega.
