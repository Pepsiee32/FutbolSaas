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

        var user = await _users.FindByEmailAsync(req.Email);
        if (user is null) 
            return Unauthorized(new { message = "Usuario no encontrado" });

        var ok = await _users.CheckPasswordAsync(user, req.Password);
        if (!ok) 
            return Unauthorized(new { message = "Contraseña incorrecta" });

        var token = CreateJwt(user);

        var isProduction = _env.IsProduction();

        Response.Cookies.Append("auth_token", token, new CookieOptions
        {
            HttpOnly = true,
            SameSite = SameSiteMode.Lax,
            Secure = isProduction, // Secure solo en producción (HTTPS)
            Path = "/",
            MaxAge = TimeSpan.FromMinutes(int.Parse(_cfg["Jwt:ExpiresMinutes"]!))
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
        Response.Cookies.Delete("auth_token");
        return Ok();
    }

    private string CreateJwt(ApplicationUser user)
    {
        var key = _cfg["Jwt:Key"]!;
        var issuer = _cfg["Jwt:Issuer"]!;
        var audience = _cfg["Jwt:Audience"]!;
        var expiresMin = int.Parse(_cfg["Jwt:ExpiresMinutes"]!);

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
