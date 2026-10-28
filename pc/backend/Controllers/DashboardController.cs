using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Omavest.Data;
using Omavest.Services;

namespace Omavest.Controllers;

[ApiController, Route("api/dashboard")]
public class DashboardController(AppDbContext db, FirebaseAuthService auth) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var current = await auth.ResolveAsync(Request);
        var uid = current?.Uid ?? "demo";
        var profile = await db.Usuarios.FirstOrDefaultAsync(u => u.FirebaseUid == uid) ?? await db.Usuarios.FirstAsync(u => u.FirebaseUid == "demo");
        var hoje = DateOnly.FromDateTime(DateTime.Today);
        var dias = profile.DataVestibular is null ? 0 : Math.Max(0, profile.DataVestibular.Value.DayNumber - hoje.DayNumber);
        var respostas = await db.SimuladoRespostas.Where(r => r.Tentativa!.FirebaseUid == uid).ToListAsync();
        var questoesResolvidas = respostas.Count;
        var media = respostas.Count == 0 ? 0 : (int)Math.Round(respostas.Count(r => r.Correta) * 100.0 / respostas.Count);

        var recentDates = await db.Progressos.Where(p => p.FirebaseUid == uid)
            .Select(p => p.AtualizadoEm.Date).Distinct().OrderByDescending(d => d).Take(30).ToListAsync();
        var streak = CalculateStreak(recentDates);

        var cronograma = await db.Cronogramas.Where(c => c.FirebaseUid == uid && c.Data >= hoje && c.Data <= hoje.AddDays(7))
            .OrderBy(c => c.Data).ThenBy(c => c.Id).Take(6)
            .Select(c => new { c.Id, c.Data, c.Titulo, c.Percentual, c.Concluido, disciplina = c.Disciplina!.Nome, tema = c.Tema != null ? c.Tema.Nome : "Revisão" }).ToListAsync();

        var proximos = await db.CalendarioVestibulares.Where(c => c.Ativo && c.DataInicio >= hoje).OrderBy(c => c.DataInicio).Take(3)
            .Select(c => new { c.Id, c.Instituicao, c.Evento, c.DataInicio, c.Tipo }).ToListAsync();

        var progressoRows = await db.Progressos.Include(p => p.Conteudo).ThenInclude(c => c!.Tema).ThenInclude(t => t!.Disciplina)
            .Where(p => p.FirebaseUid == uid).AsNoTracking().ToListAsync();
        var progresso = progressoRows.GroupBy(p => p.Conteudo?.Tema?.Disciplina?.Nome ?? "Outros")
            .Select(g => new { disciplina = g.Key, percentual = (int)Math.Round(g.Average(x => x.Percentual)) }).OrderByDescending(x => x.percentual).Take(5).ToList();

        return Ok(new
        {
            success = true,
            demo = current == null,
            usuario = new { nome = current?.Name ?? profile.Nome, profile.VestibularAlvo },
            estatisticas = new { diasParaVestibular = dias, diasSequencia = streak, questoesResolvidas, mediaAcertos = media },
            cronograma, proximos, progresso
        });
    }

    private static int CalculateStreak(List<DateTime> dates)
    {
        if (dates.Count == 0) return 0;
        var set = dates.Select(d => d.Date).ToHashSet();
        var cursor = DateTime.Today;
        if (!set.Contains(cursor) && set.Contains(cursor.AddDays(-1))) cursor = cursor.AddDays(-1);
        var count = 0;
        while (set.Contains(cursor)) { count++; cursor = cursor.AddDays(-1); }
        return count;
    }
}
