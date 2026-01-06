namespace Futbol.Api.DTOs;

public record RegisterRequest(string Email, string Password);
public record LoginRequest(string Email, string Password);
public record MeResponse(string Email);
