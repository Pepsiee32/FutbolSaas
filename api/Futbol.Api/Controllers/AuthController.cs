using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.RegularExpressions;
using Futbol.Api.DTOs;
using Futbol.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;

namespace Futbol.Api.Controllers;

[ApiController]
[Route("auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _users;
    private readonly IConfiguration _cfg;
    private readonly IWebHostEnvironment _env;

    public AuthController(UserManager<ApplicationUser> users, IConfiguration cfg, IWebHostEnvironment env)
    {
        _users = users;
        _cfg = cfg;
        _env = env;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
            return BadRequest(new { message = "Email y contraseña son requeridos" });

        // Validación básica de email
        var emailRegex = new Regex(@"^[^@\s]+@[^@\s]+\.[^@\s]+$", RegexOptions.IgnoreCase);
        if (!emailRegex.IsMatch(req.Email))
            return BadRequest(new { message = "El formato del email no es válido" });

        // Sanitizar email (trim y lowercase)
        var sanitizedEmail = req.Email.Trim().ToLowerInvariant();

        var user = new ApplicationUser
        {
            UserName = sanitizedEmail,
            Email = sanitizedEmail
        };

        var result = await _users.CreateAsync(user, req.Password);
        if (!result.Succeeded)
        {
            // Devolver errores en formato que el frontend pueda parsear
            var errors = result.Errors.Select(e => new { code = e.Code, description = e.Description }).ToArray();
            return BadRequest(new { errors });
        }

        return Ok();
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
            return BadRequest(new { message = "Email y contraseña son requeridos" });

        // Sanitizar email (trim y lowercase) para que coincida con Register
        var sanitizedEmail = req.Email.Trim().ToLowerInvariant();

        var user = await _users.FindByEmailAsync(sanitizedEmail);
        if (user is null) 
            return Unauthorized(new { message = "Usuario no encontrado" });

        var ok = await _users.CheckPasswordAsync(user, req.Password);
        if (!ok) 
            return Unauthorized(new { message = "Contraseña incorrecta" });

        var token = CreateJwt(user);

        var isProduction = _env.IsProduction();
        var isHttps = Request.IsHttps || isProduction;

        Response.Cookies.Append("auth_token", token, new CookieOptions
        {
            HttpOnly = true,
            SameSite = isHttps ? SameSiteMode.None : SameSiteMode.Lax, // None para HTTPS cross-origin
            Secure = isHttps, // Secure en HTTPS
            Path = "/",
            MaxAge = TimeSpan.FromMinutes(int.Parse(_cfg["Jwt:ExpiresMinutes"] ?? "4320"))
        });

        return Ok(new { message = "Login exitoso" });
    }

    [Authorize]
    [HttpGet("me")]
    public IActionResult Me()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";
        var email  = User.FindFirstValue(ClaimTypes.Email) ?? "";
        return Ok(new { id = userId, email });
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        var isProduction = _env.IsProduction();
        var isHttps = Request.IsHttps || isProduction;

        Response.Cookies.Delete("auth_token", new CookieOptions
        {
            HttpOnly = true,
            SameSite = isHttps ? SameSiteMode.None : SameSiteMode.Lax,
            Secure = isHttps,
            Path = "/"
        });
        return Ok();
    }

    private string CreateJwt(ApplicationUser user)
    {
        var key = _cfg["Jwt:Key"] 
            ?? _cfg["JWT_KEY"]
            ?? throw new InvalidOperationException("JWT Key no configurada");
        var issuer = _cfg["Jwt:Issuer"] 
            ?? _cfg["JWT_ISSUER"]
            ?? "Futbol.Api";
        var audience = _cfg["Jwt:Audience"] 
            ?? _cfg["JWT_AUDIENCE"]
            ?? "Futbol.Web";
        var expiresMinStr = _cfg["Jwt:ExpiresMinutes"] ?? _cfg["JWT_EXPIRES_MINUTES"] ?? "4320";
        var expiresMin = int.Parse(expiresMinStr);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Email, user.Email!)
        };

        var creds = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            SecurityAlgorithms.HmacSha256);

        var jwt = new JwtSecurityToken(
            issuer,
            audience,
            claims,
            expires: DateTime.UtcNow.AddMinutes(expiresMin),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(jwt);
    }
}
