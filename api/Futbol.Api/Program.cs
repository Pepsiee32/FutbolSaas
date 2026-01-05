using System.Text;
using Futbol.Api.Data;
using Futbol.Api.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlServer(builder.Configuration.GetConnectionString("Default")));

// Identity (usuarios)
builder.Services
    .AddIdentity<ApplicationUser, IdentityRole>(opt =>
    {
        opt.Password.RequireNonAlphanumeric = false;
        opt.User.RequireUniqueEmail = true;
    })
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

// ✅ IMPORTANTE: evitar redirects tipo /Account/Login en APIs.
// En vez de redirigir, devolvemos 401/403.
builder.Services.ConfigureApplicationCookie(opt =>
{
    opt.Events.OnRedirectToLogin = ctx =>
    {
        ctx.Response.StatusCode = StatusCodes.Status401Unauthorized;
        return Task.CompletedTask;
    };

    opt.Events.OnRedirectToAccessDenied = ctx =>
    {
        ctx.Response.StatusCode = StatusCodes.Status403Forbidden;
        return Task.CompletedTask;
    };
});

// JWT (validación + lectura desde cookie)
var jwtKey = builder.Configuration["Jwt:Key"]!;
var jwtIssuer = builder.Configuration["Jwt:Issuer"]!;
var jwtAudience = builder.Configuration["Jwt:Audience"]!;

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opt =>
    {
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ClockSkew = TimeSpan.FromMinutes(2)
        };

        // JWT en cookie: auth_token
        opt.Events = new JwtBearerEvents
        {
            OnMessageReceived = ctx =>
            {
                if (ctx.Request.Cookies.TryGetValue("auth_token", out var token))
                    ctx.Token = token;

                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

// CORS para Next.js
builder.Services.AddCors(opt =>
{
    opt.AddPolicy("web", p =>
        p.WithOrigins("http://localhost:3000")
         .AllowAnyHeader()
         .AllowAnyMethod()
         .AllowCredentials());
});

var app = builder.Build();

app.UseCors("web");

// app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapGet("/ping", () => Results.Ok("ok"));

// --- DEBUG (si querés, después borrás estos 2) ---
app.MapGet("/debug/matches", () => "matches route alive");

app.MapGet("/debug/routes", (IEnumerable<Microsoft.AspNetCore.Routing.EndpointDataSource> sources) =>
{
    var routes = sources
        .SelectMany(s => s.Endpoints)
        .OfType<Microsoft.AspNetCore.Routing.RouteEndpoint>()
        .Select(e => "/" + e.RoutePattern.RawText.TrimStart('/'))
        .OrderBy(x => x)
        .ToList();

    return Results.Ok(routes);
});
// -----------------------------------------------

app.Run();
