using Microsoft.AspNetCore.Authentication.JwtBearer;
using System.Security.Claims;
using Futbol.Api.Data;
using Futbol.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Futbol.Api.DTOs.matches;

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

    // ======================
    // Helpers
    // ======================
    private string? CurrentUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier);

    // ======================
    // GET /matches
    // ======================
    [HttpGet]
    public async Task<ActionResult<List<MatchResponse>>> GetMine()
    {
        var userId = CurrentUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var items = await _db.Matches
            .Where(m => m.UserId == userId)
            .OrderByDescending(m => m.Date)
            .Select(m => new MatchResponse(
                m.Id,
                m.Date,
                m.Opponent,
                m.Format,
                m.Goals,
                m.Assists,
                m.Result,
                m.IsMvp,
                m.Notes
            ))
            .ToListAsync();

        return Ok(items);
    }

    // ======================
    // GET /matches/{id}
    // ======================
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<MatchResponse>> GetOne(Guid id)
    {
        var userId = CurrentUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var m = await _db.Matches
            .Where(x => x.Id == id && x.UserId == userId)
            .Select(x => new MatchResponse(
                x.Id,
                x.Date,
                x.Opponent,
                x.Format,
                x.Goals,
                x.Assists,
                x.Result,
                x.IsMvp,
                x.Notes
            ))
            .FirstOrDefaultAsync();

        if (m is null) return NotFound();

        return Ok(m);
    }

    // ======================
    // POST /matches
    // ======================
    [HttpPost]
    public async Task<ActionResult<MatchResponse>> Create(CreateMatchRequest req)
    {
        var userId = CurrentUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var entity = new Match
        {
            UserId = userId,
            Date = req.Date,
            Opponent = string.IsNullOrWhiteSpace(req.Opponent) ? null : req.Opponent,
            Format = req.Format,
            Goals = req.Goals,
            Assists = req.Assists,
            Result = req.Result,
            IsMvp = req.IsMvp,
            Notes = string.IsNullOrWhiteSpace(req.Notes) ? null : req.Notes,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Matches.Add(entity);
        await _db.SaveChangesAsync();

        return Ok(new MatchResponse(
            entity.Id,
            entity.Date,
            entity.Opponent,
            entity.Format,
            entity.Goals,
            entity.Assists,
            entity.Result,
            entity.IsMvp,
            entity.Notes
        ));
    }

    // ======================
    // PUT /matches/{id}
    // ======================
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<MatchResponse>> Update(Guid id, UpdateMatchRequest req)
    {
        var userId = CurrentUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var entity = await _db.Matches
            .FirstOrDefaultAsync(m => m.Id == id && m.UserId == userId);

        if (entity is null) return NotFound();

        entity.Date = req.Date;
        entity.Opponent = string.IsNullOrWhiteSpace(req.Opponent) ? null : req.Opponent;
        entity.Format = req.Format;
        entity.Goals = req.Goals;
        entity.Assists = req.Assists;
        entity.Result = req.Result;
        entity.IsMvp = req.IsMvp;
        entity.Notes = string.IsNullOrWhiteSpace(req.Notes) ? null : req.Notes;
        entity.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new MatchResponse(
            entity.Id,
            entity.Date,
            entity.Opponent,
            entity.Format,
            entity.Goals,
            entity.Assists,
            entity.Result,
            entity.IsMvp,
            entity.Notes
        ));
    }

    // ======================
    // DELETE /matches/{id}
    // ======================
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = CurrentUserId();
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var entity = await _db.Matches
            .FirstOrDefaultAsync(m => m.Id == id && m.UserId == userId);

        if (entity is null) return NotFound();

        _db.Matches.Remove(entity);
        await _db.SaveChangesAsync();

        return NoContent(); // 204
    }
}
