using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Omavest.Data;
using Omavest.Models;
using Omavest.Services;

namespace Omavest.Controllers;

[ApiController, Route("api/calendario-vestibulares")]
public class CalendarioVestibularesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var hoje = DateOnly.FromDateTime(DateTime.Today);
        var data = await db.CalendarioVestibulares.Where(c => c.Ativo && c.DataInicio >= hoje.AddDays(-30)).OrderBy(c => c.DataInicio).ToListAsync();
        return Ok(new { success = true, data, aviso = "Confirme datas oficiais nos sites das instituições antes de tomar decisões." });
    }
}

[ApiController, Route("api/universidades")]
public class UniversidadesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(string? busca)
    {
        var q = db.Universidades.Where(u => u.Ativa);
        if (!string.IsNullOrWhiteSpace(busca)) q = q.Where(u => u.Nome.Contains(busca) || u.Sigla.Contains(busca) || u.Vestibular.Contains(busca));
        var data = await q.OrderBy(u => u.Sigla).ToListAsync();
        return Ok(new { success = true, data });
    }
}

[ApiController, Route("api/favoritos")]
public class FavoritosController(AppDbContext db, FirebaseAuthService auth) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var user = await auth.ResolveAsync(Request);
        if (user == null) return Unauthorized(new { success = false, message = "Não autenticado." });
        var data = await db.Favoritos.Where(f => f.FirebaseUid == user.Uid).OrderByDescending(f => f.CriadoEm)
            .Select(f => new { f.ConteudoId, f.CriadoEm, titulo = f.Conteudo!.Titulo, tipo = f.Conteudo.Tipo, tema = f.Conteudo.Tema!.Nome, disciplina = f.Conteudo.Tema.Disciplina!.Nome }).ToListAsync();
        return Ok(new { success = true, data });
    }

    [HttpPost("alternar")]
    public async Task<IActionResult> Alternar([FromBody] FavoritoRequest req)
    {
        var user = await auth.ResolveAsync(Request);
        if (user == null) return Unauthorized(new { success = false, message = "Não autenticado." });
        var existing = await db.Favoritos.FirstOrDefaultAsync(f => f.FirebaseUid == user.Uid && f.ConteudoId == req.ConteudoId);
        if (existing != null) { db.Favoritos.Remove(existing); await db.SaveChangesAsync(); return Ok(new { success = true, favorito = false }); }
        if (!await db.Conteudos.AnyAsync(c => c.Id == req.ConteudoId && c.Ativo)) return NotFound(new { success = false, message = "Conteúdo não encontrado." });
        db.Favoritos.Add(new Favorito { FirebaseUid = user.Uid, ConteudoId = req.ConteudoId });
        await db.SaveChangesAsync();
        return Ok(new { success = true, favorito = true });
    }
}
