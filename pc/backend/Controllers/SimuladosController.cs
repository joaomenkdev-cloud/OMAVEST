using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Omavest.Data;
using Omavest.Models;
using Omavest.Services;

namespace Omavest.Controllers;

[ApiController, Route("api/questoes")]
public class QuestoesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Listar(string? materia, string? dificuldade, int? ano, int limit = 20)
    {
        var q = db.Questoes.Where(x => x.Ativo);
        if (!string.IsNullOrWhiteSpace(materia)) q = q.Where(x => x.Materia == materia);
        if (!string.IsNullOrWhiteSpace(dificuldade)) q = q.Where(x => x.Dificuldade == dificuldade);
        if (ano != null) q = q.Where(x => x.Ano == ano);
        var data = await q.OrderBy(_ => EF.Functions.Random()).Take(Math.Clamp(limit, 1, 100))
            .Select(x => new
            {
                x.Id, x.Materia, x.Tema, x.Ano, x.Dificuldade, x.Enunciado,
                alternativas = new { A = x.AlternativaA, B = x.AlternativaB, C = x.AlternativaC, D = x.AlternativaD, E = x.AlternativaE },
                x.Fonte
            }).ToListAsync();
        return Ok(new { success = true, data, total = data.Count });
    }

    [HttpGet("materias")]
    public async Task<IActionResult> Materias()
    {
        var data = await db.Questoes.Where(q => q.Ativo).GroupBy(q => q.Materia)
            .Select(g => new { materia = g.Key, total = g.Count() }).OrderBy(x => x.materia).ToListAsync();
        return Ok(new { success = true, data });
    }

    [HttpGet("{id:int}/explicacao")]
    public async Task<IActionResult> Explicacao(int id)
    {
        var q = await db.Questoes.FirstOrDefaultAsync(x => x.Id == id && x.Ativo);
        if (q == null) return NotFound(new { success = false, message = "Questão não encontrada." });
        return Ok(new { success = true, resposta = q.RespostaCorreta, explicacao = q.Explicacao, fonte = q.Fonte });
    }
}

[ApiController, Route("api/simulados")]
public class SimuladosController(AppDbContext db, FirebaseAuthService auth) : ControllerBase
{
    [HttpGet("modelos")]
    public async Task<IActionResult> Modelos()
    {
        var data = await db.Provas.Where(p => p.Ativo).OrderByDescending(p => p.Ano)
            .Select(p => new { p.Id, p.Titulo, p.Ano, p.Instituicao, p.Area, p.QuantidadeQuestoes, p.DuracaoMinutos, p.Fonte }).ToListAsync();
        return Ok(new { success = true, data });
    }

    [HttpPost]
    public async Task<IActionResult> Criar([FromBody] CriarSimuladoRequest req)
    {
        var user = await auth.ResolveAsync(Request);
        if (user == null) return Unauthorized(new { success = false, message = "Entre com Firebase para iniciar um simulado." });
        var q = db.Questoes.Where(x => x.Ativo);
        if (req.Materias is { Length: > 0 }) q = q.Where(x => req.Materias.Contains(x.Materia));
        var questoes = await q.OrderBy(_ => EF.Functions.Random()).Take(Math.Clamp(req.Quantidade, 1, 90)).ToListAsync();
        if (questoes.Count == 0) return BadRequest(new { success = false, message = "Não há questões para os filtros escolhidos." });

        var tentativa = new SimuladoTentativa { FirebaseUid = user.Uid, Vestibular = req.Vestibular, TotalQuestoes = questoes.Count };
        db.Simulados.Add(tentativa);
        await db.SaveChangesAsync();
        var data = questoes.Select(x => new
        {
            x.Id, x.Materia, x.Tema, x.Ano, x.Dificuldade, x.Enunciado,
            alternativas = new { A = x.AlternativaA, B = x.AlternativaB, C = x.AlternativaC, D = x.AlternativaD, E = x.AlternativaE }, x.Fonte
        });
        return Ok(new { success = true, tentativaId = tentativa.Id, data });
    }

    [HttpPost("{id:int}/finalizar")]
    public async Task<IActionResult> Finalizar(int id, [FromBody] FinalizarSimuladoRequest req)
    {
        var user = await auth.ResolveAsync(Request);
        if (user == null) return Unauthorized(new { success = false, message = "Não autenticado." });
        var tentativa = await db.Simulados.Include(t => t.Respostas).FirstOrDefaultAsync(t => t.Id == id && t.FirebaseUid == user.Uid);
        if (tentativa == null) return NotFound(new { success = false, message = "Tentativa não encontrada." });
        if (tentativa.FinalizadoEm != null) return BadRequest(new { success = false, message = "Simulado já finalizado." });

        var ids = req.Respostas.Select(r => r.QuestaoId).Distinct().ToArray();
        var questoes = await db.Questoes.Where(q => ids.Contains(q.Id)).ToDictionaryAsync(q => q.Id);
        var resultado = new List<object>();
        var acertos = 0;
        foreach (var item in req.Respostas)
        {
            if (!questoes.TryGetValue(item.QuestaoId, out var questao)) continue;
            var resposta = item.Resposta.Trim().ToUpperInvariant();
            var correta = resposta == questao.RespostaCorreta.ToUpperInvariant();
            if (correta) acertos++;
            db.SimuladoRespostas.Add(new SimuladoResposta { SimuladoTentativaId = tentativa.Id, QuestaoId = questao.Id, Resposta = resposta, Correta = correta });
            resultado.Add(new { questaoId = questao.Id, correta, respostaCorreta = questao.RespostaCorreta, explicacao = questao.Explicacao, fonte = questao.Fonte });
        }
        tentativa.Acertos = acertos;
        tentativa.FinalizadoEm = DateTime.UtcNow;
        await db.SaveChangesAsync();
        var percentual = tentativa.TotalQuestoes == 0 ? 0 : (int)Math.Round(acertos * 100.0 / tentativa.TotalQuestoes);
        return Ok(new { success = true, acertos, total = tentativa.TotalQuestoes, percentual, resultado });
    }

    [HttpGet("historico")]
    public async Task<IActionResult> Historico()
    {
        var user = await auth.ResolveAsync(Request);
        if (user == null) return Unauthorized(new { success = false, message = "Não autenticado." });
        var data = await db.Simulados.Where(s => s.FirebaseUid == user.Uid && s.FinalizadoEm != null).OrderByDescending(s => s.FinalizadoEm)
            .Take(20).Select(s => new { s.Id, s.Vestibular, s.IniciadoEm, s.FinalizadoEm, s.TotalQuestoes, s.Acertos, percentual = s.TotalQuestoes == 0 ? 0 : s.Acertos * 100 / s.TotalQuestoes }).ToListAsync();
        return Ok(new { success = true, data });
    }
}

[ApiController, Route("api/provas")]
public class ProvasController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Listar(string? instituicao, int? ano)
    {
        var q = db.Provas.Where(p => p.Ativo);
        if (!string.IsNullOrWhiteSpace(instituicao)) q = q.Where(p => p.Instituicao == instituicao);
        if (ano != null) q = q.Where(p => p.Ano == ano);
        var data = await q.OrderByDescending(p => p.Ano).ThenBy(p => p.Instituicao).ToListAsync();
        return Ok(new { success = true, data });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var data = await db.Provas.FirstOrDefaultAsync(p => p.Id == id && p.Ativo);
        return data == null ? NotFound(new { success = false, message = "Prova não encontrada." }) : Ok(new { success = true, data });
    }
}
