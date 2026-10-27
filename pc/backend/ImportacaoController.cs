using Omavest.Data;
using Omavest.Models;
using Omavest.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Omavest.Controllers;

// ═══════════════════════════════════════════════════════════════════
//  DTOs DE ENTRADA/SAÍDA
// ═══════════════════════════════════════════════════════════════════

public record ImportarUrlRequest(
    string Url,
    string? GabaritoUrl = null);

public record ImportarListaRequest(
    List<string> Urls);

// ═══════════════════════════════════════════════════════════════════
//  ADMIN — IMPORTAÇÃO DE PDFs
// ═══════════════════════════════════════════════════════════════════

[ApiController, Route("api/admin/importacao"), LocalOnly]
public class ImportacaoController(
    AppDbContext db,
    PdfImportService importService,
    ILogger<ImportacaoController> logger) : ControllerBase
{
    // ── POST /api/admin/importacao/url ────────────────────────────
    /// <summary>
    /// Importa questões de um único PDF pelo link.
    /// Baixa o PDF, extrai questões, classifica por matéria e salva no banco.
    /// </summary>
    [HttpPost("url")]
    public async Task<IActionResult> ImportarUrl([FromBody] ImportarUrlRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Url))
            return BadRequest(new { success = false, message = "URL obrigatória." });

        logger.LogInformation("Requisição de importação: {Url}", req.Url);

        var resultado = await importService.ImportarAsync(req.Url, req.GabaritoUrl);

        return resultado.Success
            ? Ok(new
              {
                  success      = true,
                  mensagem     = resultado.Mensagem,
                  fonte_url    = resultado.FonteUrl,
                  questoes_salvas  = resultado.QuestoesSalvas,
                  duplicadas   = resultado.QueuesIgnoradas,
                  erros_parse  = resultado.ErrosParsing,
                  avisos       = resultado.Erros,
              })
            : StatusCode(500, new
              {
                  success  = false,
                  mensagem = resultado.Mensagem,
                  erros    = resultado.Erros,
              });
    }

    // ── POST /api/admin/importacao/lista ──────────────────────────
    /// <summary>
    /// Importa questões de múltiplas URLs de uma vez.
    /// </summary>
    [HttpPost("lista")]
    public async Task<IActionResult> ImportarLista([FromBody] ImportarListaRequest req)
    {
        if (req.Urls == null || req.Urls.Count == 0)
            return BadRequest(new { success = false, message = "Lista de URLs vazia." });

        var resultados = new List<object>();
        var totalSalvas = 0;

        foreach (var url in req.Urls)
        {
            var r = await importService.ImportarAsync(url);
            totalSalvas += r.QuestoesSalvas;
            resultados.Add(new
            {
                url          = r.FonteUrl,
                success      = r.Success,
                mensagem     = r.Mensagem,
                salvas       = r.QuestoesSalvas,
                duplicadas   = r.QueuesIgnoradas,
                erros        = r.ErrosParsing,
            });
            await Task.Delay(300); // respeitar rate limiting dos servidores
        }

        return Ok(new
        {
            success        = true,
            total_salvas   = totalSalvas,
            total_urls     = req.Urls.Count,
            resultados     = resultados,
        });
    }

    // ── POST /api/admin/importacao/todas ──────────────────────────
    /// <summary>
    /// Importa TODAS as provas do catálogo oficial (ENEM 2022-2024, FUVEST 2023-2025, UNICAMP 2024-2025).
    /// </summary>
    [HttpPost("todas")]
    public async Task<IActionResult> ImportarTodas()
    {
        logger.LogInformation("Iniciando importação de TODAS as fontes conhecidas...");
        var resultados = await importService.ImportarTodasAsync();

        var totalSalvas = resultados.Sum(r => r.QuestoesSalvas);
        var sucessos    = resultados.Count(r => r.Success);

        return Ok(new
        {
            success       = true,
            total_urls    = resultados.Count,
            total_salvas  = totalSalvas,
            sucessos      = sucessos,
            falhas        = resultados.Count - sucessos,
            detalhes      = resultados.Select(r => new
            {
                url       = r.FonteUrl,
                success   = r.Success,
                mensagem  = r.Mensagem,
                salvas    = r.QuestoesSalvas,
                duplicadas= r.QueuesIgnoradas,
            }).ToList(),
        });
    }

    // ── GET /api/admin/importacao/fontes ──────────────────────────
    /// <summary>
    /// Lista todas as fontes cadastradas no catálogo.
    /// </summary>
    [HttpGet("fontes")]
    public IActionResult ListarFontes()
    {
        return Ok(new
        {
            success = true,
            fontes  = PdfImportService.FontesConhecidas.Select(f => new
            {
                url         = f.Url,
                gabarito_url= f.GabaritoUrl,
                instituicao = f.Instituicao,
                ano         = f.Ano,
                caderno     = f.Caderno,
                periodo     = f.Periodo,
            }).ToList()
        });
    }
}


// ═══════════════════════════════════════════════════════════════════
//  QUESTÕES PÚBLICAS — Endpoint para o Simulado
// ═══════════════════════════════════════════════════════════════════

[ApiController, Route("api/questoes")]
public class QuestoesPublicasController(AppDbContext db) : ControllerBase
{
    // ── GET /api/questoes?materia=Matemática&limit=45 ─────────────
    /// <summary>
    /// Retorna questões aleatórias por matéria para o simulado.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Listar(
        [FromQuery] string? materia = null,
        [FromQuery] int     limit   = 45)
    {
        var query = db.Questoes
            .Where(q => q.Ativo && !string.IsNullOrEmpty(q.AlternativaA))
            .AsQueryable();

        if (!string.IsNullOrEmpty(materia))
            query = query.Where(q => q.Materia.ToLower() == materia.ToLower());

        // Selecionar colunas relevantes (sem ID interno para o front)
        var questoes = await query
            .Select(q => new
            {
                q.Id,
                q.NumeroQuestao,
                q.Materia,
                q.Dificuldade,
                q.Enunciado,
                q.AlternativaA,
                q.AlternativaB,
                q.AlternativaC,
                q.AlternativaD,
                q.AlternativaE,
                q.RespostaCorreta,
                q.Ano,
                q.Instituicao,
                Caderno = q.Prova != null ? q.Prova.Periodo : "",
            })
            .ToListAsync();

        // Embaralhar em memória (SQLite não suporta ORDER BY RANDOM() eficientemente)
        var rng       = new Random();
        var embaral   = questoes.OrderBy(_ => rng.Next()).Take(limit).ToList();

        return Ok(new
        {
            success = true,
            materia = materia,
            total   = embaral.Count,
            data    = embaral,
        });
    }

    // ── GET /api/questoes/materias ────────────────────────────────
    [HttpGet("materias")]
    public async Task<IActionResult> ListarMaterias()
    {
        var materias = await db.Questoes
            .Where(q => q.Ativo)
            .GroupBy(q => q.Materia)
            .Select(g => new { materia = g.Key, total = g.Count() })
            .OrderBy(m => m.materia)
            .ToListAsync();

        return Ok(new { success = true, data = materias });
    }
}
