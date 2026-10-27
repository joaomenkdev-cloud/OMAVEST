using Omavest.Data;
using Omavest.Models;
using Omavest.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text;
using System.Text.Json;

namespace Omavest.Controllers;

// ══════════════════════════════════════════════════════════════
//  NOTÍCIAS E EDITAIS
// ══════════════════════════════════════════════════════════════
[ApiController, Route("api/noticias")]
public class NoticiasController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Listar(string? categoria, int pagina = 1, int limite = 10)
    {
        var query = db.Noticias.Where(n => n.Publicado);
        if (!string.IsNullOrEmpty(categoria)) query = query.Where(n => n.Categoria == categoria);

        var total = await query.CountAsync();
        var dados = await query.OrderByDescending(n => n.PublicadoEm)
                               .Skip((pagina - 1) * limite).Take(limite)
                               .ToListAsync();
        return Ok(new { success = true, total, pagina, data = dados });
    }

    [HttpGet("destaques")]
    public async Task<IActionResult> Destaques() =>
        Ok(new { success = true, data = await db.Noticias
            .Where(n => n.Publicado && n.Destaque)
            .OrderByDescending(n => n.PublicadoEm).Take(3).ToListAsync() });

    [HttpGet("recentes")]
    public async Task<IActionResult> Recentes(int limite = 5) =>
        Ok(new { success = true, data = await db.Noticias
            .Where(n => n.Publicado)
            .OrderByDescending(n => n.PublicadoEm)
            .Take(limite)
            .Select(n => new { n.Id, n.Titulo, n.Resumo, n.Categoria, n.BadgeTipo, n.PublicadoEm })
            .ToListAsync() });

    [HttpGet("{slugOuId}")]
    public async Task<IActionResult> Get(string slugOuId)
    {
        Noticia? noticia;
        if (int.TryParse(slugOuId, out var id))
            noticia = await db.Noticias.FirstOrDefaultAsync(n => n.Id == id && n.Publicado);
        else
            noticia = await db.Noticias.FirstOrDefaultAsync(n => n.Slug == slugOuId && n.Publicado);

        if (noticia == null) return NotFound(new { success = false, message = "Não encontrada." });
        noticia.Views++;
        await db.SaveChangesAsync();
        return Ok(new { success = true, data = noticia });
    }
}


// ══════════════════════════════════════════════════════════════
//  PROVAS
// ══════════════════════════════════════════════════════════════
[ApiController, Route("api/provas")]
public class ProvasController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Listar(int? ano, string? area, string? instituicao)
    {
        var q = db.Provas.Where(p => p.Ativo);
        if (ano != null)          q = q.Where(p => p.Ano == ano);
        if (!string.IsNullOrEmpty(area)) q = q.Where(p => p.Area == area);
        if (!string.IsNullOrEmpty(instituicao)) q = q.Where(p => p.Instituicao == instituicao);
        var dados = await q.OrderByDescending(p => p.Ano).ThenBy(p => p.Id).ToListAsync();
        return Ok(new { success = true, data = dados, total = dados.Count });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var prova = await db.Provas.FirstOrDefaultAsync(p => p.Id == id && p.Ativo);
        if (prova == null) return NotFound(new { success = false, message = "Não encontrada." });
        return Ok(new { success = true, data = prova });
    }

    [HttpPost("{id:int}/download")]
    public async Task<IActionResult> Download(int id)
    {
        var prova = await db.Provas.FirstOrDefaultAsync(p => p.Id == id && p.Ativo);
        if (prova == null) return NotFound(new { success = false, message = "Não encontrada." });
        prova.Downloads++;
        await db.SaveChangesAsync();
        return Ok(new { success = true, prova_url = prova.ProvaUrl, gabarito_url = prova.GabaritoUrl, titulo = prova.Titulo });
    }
}


// ══════════════════════════════════════════════════════════════
//  CRONOGRAMA
// ══════════════════════════════════════════════════════════════
[ApiController, Route("api/cronograma")]
public class CronogramaController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var itens = await db.Cronograma.Where(c => c.Ativo).OrderBy(c => c.Ordem).ToListAsync();
        var resultado = itens.Select(c => new
        {
            c.Id, c.Titulo, c.Descricao,
            data_inicio = c.DataInicio.ToString("yyyy-MM-dd"),
            data_fim    = c.DataFim.ToString("yyyy-MM-dd"),
            c.Ordem,
            status = InscricaoService.CalcStatus(c.DataInicio, c.DataFim)
        });
        return Ok(resultado);
    }
}


// ══════════════════════════════════════════════════════════════
//  DASHBOARD DO CANDIDATO
// ══════════════════════════════════════════════════════════════
[ApiController, Route("api/candidato")]
public class CandidatoController(AppDbContext db, AuthService auth) : ControllerBase
{
    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard()
    {
        var tokenVal = AuthService.ExtrairToken(Request.Headers.Authorization);
        var u = await auth.ValidarTokenAsync(tokenVal);
        if (u == null) return Unauthorized(new { success = false, message = "Não autenticado." });

        var insc   = await db.Inscricoes.FirstOrDefaultAsync(i => i.NumeroInscricao == u.NumeroInscricao);
        var pag    = await db.Pagamentos.FirstOrDefaultAsync(p => p.NumeroInscricao == u.NumeroInscricao);
        var provaDia = await db.Cronograma.Where(c => c.Ativo && c.Titulo == "Prova").Select(c => (DateOnly?)c.DataInicio).FirstOrDefaultAsync();
        var dias   = provaDia == null ? 0 : Math.Max(0, provaDia.Value.DayNumber - DateOnly.FromDateTime(DateTime.UtcNow).DayNumber);
        var comuns = await db.Noticias.Where(n => n.Publicado)
                        .OrderByDescending(n => n.PublicadoEm).Take(3)
                        .Select(n => new { n.Id, n.Titulo, n.Resumo, n.Categoria, n.BadgeTipo, n.PublicadoEm })
                        .ToListAsync();

        return Ok(new
        {
            success = true,
            usuario = new { u.NumeroInscricao, u.Nome, u.Email },
            inscricao = insc, pagamento = pag,
            dias_para_prova = dias, data_prova = provaDia?.ToString("yyyy-MM-dd"), comunicados = comuns
        });
    }
}


// ══════════════════════════════════════════════════════════════
//  HEALTH CHECK
// ══════════════════════════════════════════════════════════════
[ApiController, Route("api/health")]
public class HealthController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var inscricoes    = await db.Inscricoes.CountAsync();
        var tokensAtivos  = await db.Tokens.CountAsync(t => t.Ativo);
        var totalQuestoes = await db.Questoes.CountAsync(q => q.Ativo);
        return Ok(new
        {
            status = "online", version = "4.0.0",
            timestamp = DateTime.UtcNow.ToString("O"),
            inscricoes, tokens_ativos = tokensAtivos, questoes = totalQuestoes
        });
    }
}



// ══════════════════════════════════════════════════════════════
//  Restringe endpoints administrativos ao computador que hospeda o sistema
// ══════════════════════════════════════════════════════════════
public class LocalOnlyAttribute : Microsoft.AspNetCore.Mvc.Filters.ActionFilterAttribute
{
    public override void OnActionExecuting(Microsoft.AspNetCore.Mvc.Filters.ActionExecutingContext context)
    {
        var ip = context.HttpContext.Connection.RemoteIpAddress;
        if (ip == null || !System.Net.IPAddress.IsLoopback(ip))
            context.Result = new ObjectResult(new { success = false, message = "Disponível apenas no computador que hospeda o OMAVEST." }) { StatusCode = 403 };
    }
}
