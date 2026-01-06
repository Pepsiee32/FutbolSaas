using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
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

    public AuthController(UserManager<ApplicationUser> users, IConfiguration cfg)
    {
        _users = users;
        _cfg = cfg;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest req)
    {
        var user = new ApplicationUser
        {
            UserName = req.Email,
            Email = req.Email
        };

        var result = await _users.CreateAsync(user, req.Password);
        if (!result.Succeeded)
            return BadRequest(result.Errors);

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

        Response.Cookies.Append("auth_token", token, new CookieOptions
        {
            HttpOnly = true,
            SameSite = SameSiteMode.Lax,
            Secure = false, // en local http
            Path = "/"
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
