namespace Futbol.Api.DTOs;

public record MatchResponse(
    Guid Id,
    DateTime Date,
    string? Opponent,
    string? Location,
    int? Format,
    int? Goals,
    int? Assists,
    string? Notes
);

public record CreateMatchRequest(
    DateTime Date,
    string? Opponent,
    string? Location,
    int? Format,
    int? Goals,
    int? Assists,
    string? Notes
);
