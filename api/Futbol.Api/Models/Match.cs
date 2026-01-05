namespace Futbol.Api.Models;

public class Match
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string UserId { get; set; } = default!;
    public DateTime Date { get; set; }
    public string? Opponent { get; set; }
    public string? Location { get; set; }
    public int? Format { get; set; }
    public int? Goals { get; set; }
    public int? Assists { get; set; }
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
