# 📋 Cómo Ver los Logs de Render

## Pasos para Ver los Logs

1. **Accede a Render Dashboard**
   - Ve a: https://dashboard.render.com
   - Inicia sesión

2. **Selecciona tu Servicio**
   - Busca y haz clic en `futbolsaas-1`

3. **Ve a la Pestaña "Logs"**
   - En el menú lateral izquierdo, haz clic en **"Logs"**
   - O busca la pestaña/sección **"Logs"**

4. **Busca Errores**
   - Los errores suelen aparecer en **rojo**
   - Busca líneas que contengan palabras como:
     - `error`
     - `Error`
     - `ERROR`
     - `Exception`
     - `Failed`
     - `500`

5. **Copia los Errores**
   - Selecciona las líneas de error (las últimas 20-30 líneas suelen ser suficientes)
   - Cópialas y compártelas

## 📸 Qué Buscar Específicamente

Busca errores relacionados con:
- **JWT**: `Jwt:Key`, `JWT_KEY`, `null`, `missing`
- **Database**: `connection`, `PostgreSQL`, `Npgsql`
- **CORS**: `CORS`, `origin`
- **Exception**: Cualquier `System.Exception` o stack trace

## 🔍 Ejemplo de lo que Buscar

```
[Error] System.ArgumentNullException: Value cannot be null. (Parameter 'key')
   at Microsoft.IdentityModel.Tokens.SymmetricSecurityKey..ctor(Byte[] key)
   at Futbol.Api.Controllers.AuthController.CreateJwt(ApplicationUser user)
```

O:

```
[Error] Npgsql.NpgsqlException: Connection refused
```

## 💡 Tip

- Los logs más recientes están al **final**
- Desplázate hacia abajo para ver los errores más recientes
- Si hay muchos logs, busca específicamente por "Error" o "Exception"
