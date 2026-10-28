using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Omavest.Data;

namespace Omavest.Controllers;

[ApiController, Route("api/acervo")]
public class AcervoController(AppDbContext db) : ControllerBase
{
    [HttpGet("disciplinas")]
    public async Task<IActionResult> Disciplinas()
    {
        var data = await db.Disciplinas.Where(d => d.Ativa).OrderBy(d => d.Ordem)
            .Select(d => new
            {
                d.Id, d.Nome, d.Slug, d.Icone, d.Cor, d.Descricao,
                temas = d.Temas.Count(t => t.Ativo),
                conteudos = d.Temas.SelectMany(t => t.Conteudos).Count(c => c.Ativo)
            }).ToListAsync();
        return Ok(new { success = true, data });
    }

    [HttpGet("disciplinas/{slug}")]
    public async Task<IActionResult> Disciplina(string slug)
    {
        var disciplina = await db.Disciplinas.Where(d => d.Ativa && d.Slug == slug)
            .Select(d => new
            {
                d.Id, d.Nome, d.Slug, d.Icone, d.Cor, d.Descricao,
                temas = d.Temas.Where(t => t.Ativo).OrderBy(t => t.Ordem).Select(t => new
                {
                    t.Id, t.Nome, t.Slug, t.Descricao,
                    conteudos = t.Conteudos.Where(c => c.Ativo).OrderBy(c => c.Id).Select(c => new
                    {
                        c.Id, c.Titulo, c.Descricao, c.Tipo, c.Dificuldade, c.Url, c.Fonte, c.DuracaoMinutos, c.Gratuito
                    })
                })
            }).FirstOrDefaultAsync();
        return disciplina == null ? NotFound(new { success = false, message = "Disciplina não encontrada." }) : Ok(new { success = true, data = disciplina });
    }

    [HttpGet("conteudos")]
    public async Task<IActionResult> Conteudos(string? busca, string? disciplina, string? tipo, int limite = 50)
    {
        var q = db.Conteudos.Include(c => c.Tema).ThenInclude(t => t!.Disciplina).Where(c => c.Ativo);
        if (!string.IsNullOrWhiteSpace(busca))
            q = q.Where(c => c.Titulo.Contains(busca) || (c.Descricao != null && c.Descricao.Contains(busca)) || c.TextoBase.Contains(busca));
        if (!string.IsNullOrWhiteSpace(disciplina))
            q = q.Where(c => c.Tema!.Disciplina!.Slug == disciplina || c.Tema.Disciplina.Nome == disciplina);
        if (!string.IsNullOrWhiteSpace(tipo)) q = q.Where(c => c.Tipo == tipo);

        var data = await q.OrderBy(c => c.Tema!.Disciplina!.Ordem).ThenBy(c => c.Tema!.Ordem).ThenBy(c => c.Id)
            .Take(Math.Clamp(limite, 1, 200))
            .Select(c => new
            {
                c.Id, c.Titulo, c.Descricao, c.Tipo, c.Dificuldade, c.Url, c.Fonte, c.DuracaoMinutos, c.Gratuito,
                tema = c.Tema!.Nome,
                disciplina = c.Tema.Disciplina!.Nome,
                disciplinaSlug = c.Tema.Disciplina.Slug
            }).ToListAsync();
        return Ok(new { success = true, data, total = data.Count });
    }

    [HttpGet("conteudos/{id:int}")]
    public async Task<IActionResult> Conteudo(int id)
    {
        var data = await db.Conteudos.Include(c => c.Tema).ThenInclude(t => t!.Disciplina)
            .Where(c => c.Id == id && c.Ativo)
            .Select(c => new
            {
                c.Id, c.Titulo, c.Descricao, c.Tipo, c.Dificuldade, c.Url, c.Fonte, c.DuracaoMinutos, c.TextoBase,
                tema = c.Tema!.Nome, disciplina = c.Tema.Disciplina!.Nome, disciplinaSlug = c.Tema.Disciplina.Slug
            }).FirstOrDefaultAsync();
        return data == null ? NotFound(new { success = false, message = "Conteúdo não encontrado." }) : Ok(new { success = true, data });
    }
}
