using Microsoft.AspNetCore.Authentication.JwtBearer;
using System.Security.Claims;
using Futbol.Api.Data;
using Futbol.Api.DTOs;
using Futbol.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Futbol.Api.Controllers;

[ApiController]
[Route("matches")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
public class MatchesController : ControllerBase
{
    private readonly AppDbContext _db;

    public MatchesController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<List<MatchResponse>>> GetMine()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var items = await _db.Matches
            .Where(m => m.UserId == userId)
            .OrderByDescending(m => m.Date)
            .Select(m => new MatchResponse(
                m.Id, m.Date, m.Opponent, m.Location, m.Format, m.Goals, m.Assists, m.Notes
            ))
            .ToListAsync();

        return Ok(items);
    }

    [HttpPost]
    public async Task<ActionResult<MatchResponse>> Create(CreateMatchRequest req)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var entity = new Match
        {
            UserId = userId,
            Date = req.Date,
            Opponent = string.IsNullOrWhiteSpace(req.Opponent) ? null : req.Opponent,
            Location = string.IsNullOrWhiteSpace(req.Location) ? null : req.Location,
            Format = req.Format,
            Goals = req.Goals,
            Assists = req.Assists,
            Notes = string.IsNullOrWhiteSpace(req.Notes) ? null : req.Notes,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Matches.Add(entity);
        await _db.SaveChangesAsync();

        return Ok(new MatchResponse(
            entity.Id, entity.Date, entity.Opponent, entity.Location, entity.Format, entity.Goals, entity.Assists, entity.Notes
        ));
    }
}
