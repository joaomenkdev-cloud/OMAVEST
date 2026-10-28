using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Omavest.Data;
using Omavest.Models;
using Omavest.Services;

namespace Omavest.Controllers;

[ApiController, Route("api/perfil")]
public class PerfilController(AppDbContext db, FirebaseAuthService auth) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var user = await auth.ResolveAsync(Request);
        if (user == null) return Unauthorized(new { success = false, message = "Entre com Firebase para acessar seu perfil." });
        var profile = await GetOrCreate(db, user);
        return Ok(new { success = true, data = profile });
    }

    [HttpPut]
    public async Task<IActionResult> Update([FromBody] PerfilRequest req)
    {
        var user = await auth.ResolveAsync(Request);
        if (user == null) return Unauthorized(new { success = false, message = "Não autenticado." });
        var profile = await GetOrCreate(db, user);
        profile.Nome = req.Nome;
        profile.Email = req.Email ?? user.Email;
        profile.VestibularAlvo = req.VestibularAlvo;
        profile.DataVestibular = req.DataVestibular;
        profile.MinutosPorDia = Math.Clamp(req.MinutosPorDia, 20, 600);
        profile.DiasDisponiveis = req.DiasDisponiveis;
        profile.AtualizadoEm = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(new { success = true, data = profile });
    }

    internal static async Task<UsuarioPerfil> GetOrCreate(AppDbContext db, AuthenticatedUser user)
    {
        var profile = await db.Usuarios.FirstOrDefaultAsync(x => x.FirebaseUid == user.Uid);
        if (profile != null) return profile;
        profile = new UsuarioPerfil { FirebaseUid = user.Uid, Nome = user.Name, Email = user.Email };
        db.Usuarios.Add(profile);
        await db.SaveChangesAsync();
        return profile;
    }
}

[ApiController, Route("api/progresso")]
public class ProgressoController(AppDbContext db, FirebaseAuthService auth) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Resumo()
    {
        var user = await auth.ResolveAsync(Request);
        if (user == null) return Unauthorized(new { success = false, message = "Não autenticado." });
        var rows = await db.Progressos.Include(p => p.Conteudo).ThenInclude(c => c!.Tema).ThenInclude(t => t!.Disciplina)
            .Where(p => p.FirebaseUid == user.Uid).AsNoTracking().ToListAsync();
        var data = rows.GroupBy(p => p.Conteudo?.Tema?.Disciplina?.Nome ?? "Outros")
            .Select(g => new { disciplina = g.Key, percentual = (int)Math.Round(g.Average(x => x.Percentual)), concluidos = g.Count(x => x.Concluido), total = g.Count() })
            .OrderByDescending(x => x.percentual).ToList();
        return Ok(new { success = true, data });
    }

    [HttpPost]
    public async Task<IActionResult> Atualizar([FromBody] AtualizarProgressoRequest req)
    {
        var user = await auth.ResolveAsync(Request);
        if (user == null) return Unauthorized(new { success = false, message = "Não autenticado." });
        if (!await db.Conteudos.AnyAsync(c => c.Id == req.ConteudoId && c.Ativo)) return NotFound(new { success = false, message = "Conteúdo não encontrado." });

        var item = await db.Progressos.FirstOrDefaultAsync(p => p.FirebaseUid == user.Uid && p.ConteudoId == req.ConteudoId);
        if (item == null)
        {
            item = new ProgressoConteudo { FirebaseUid = user.Uid, ConteudoId = req.ConteudoId };
            db.Progressos.Add(item);
        }
        item.Percentual = req.Concluido ? 100 : Math.Clamp(req.Percentual, 0, 100);
        item.Concluido = req.Concluido || item.Percentual >= 100;
        item.AtualizadoEm = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(new { success = true, data = item });
    }
}

[ApiController, Route("api/trilhas")]
public class TrilhasController(AppDbContext db, FirebaseAuthService auth) : ControllerBase
{
    [HttpGet("minha")]
    public async Task<IActionResult> Minha()
    {
        var user = await auth.ResolveAsync(Request);
        if (user == null) return Unauthorized(new { success = false, message = "Não autenticado." });
        var trilha = await db.Trilhas.Where(t => t.FirebaseUid == user.Uid).OrderByDescending(t => t.CriadoEm)
            .Select(t => new
            {
                t.Id, t.Nome, t.Vestibular, t.Descricao, t.CriadoEm,
                itens = t.Itens.OrderBy(i => i.Ordem).Select(i => new
                {
                    i.Ordem, i.ConteudoId, i.Obrigatorio, titulo = i.Conteudo!.Titulo,
                    tipo = i.Conteudo.Tipo, tema = i.Conteudo.Tema!.Nome, disciplina = i.Conteudo.Tema.Disciplina!.Nome
                })
            }).FirstOrDefaultAsync();
        return Ok(new { success = true, data = trilha });
    }

    [HttpPost("gerar")]
    public async Task<IActionResult> Gerar([FromBody] GerarTrilhaRequest req)
    {
        var user = await auth.ResolveAsync(Request);
        if (user == null) return Unauthorized(new { success = false, message = "Não autenticado." });
        var itensPor = Math.Clamp(req.ItensPorDisciplina, 1, 8);
        var prioridades = req.DisciplinasDificuldade.Select(x => x.Trim()).Where(x => x != "").ToHashSet(StringComparer.OrdinalIgnoreCase);
        var disciplinas = await db.Disciplinas.Where(d => d.Ativa).OrderBy(d => d.Ordem).ToListAsync();
        disciplinas = disciplinas.OrderByDescending(d => prioridades.Contains(d.Nome)).ThenBy(d => d.Ordem).ToList();

        var trilha = new Trilha { FirebaseUid = user.Uid, Vestibular = req.Vestibular, Nome = $"Trilha {req.Vestibular}", Descricao = "Trilha gerada a partir das disciplinas indicadas como prioridade." };
        db.Trilhas.Add(trilha);
        await db.SaveChangesAsync();

        var ordem = 1;
        foreach (var disciplina in disciplinas)
        {
            var conteúdos = await db.Conteudos.Where(c => c.Ativo && c.Tema!.DisciplinaId == disciplina.Id).OrderBy(c => c.Tema!.Ordem).ThenBy(c => c.Id).Take(itensPor).ToListAsync();
            foreach (var conteúdo in conteúdos) db.TrilhasConteudos.Add(new TrilhaConteudo { TrilhaId = trilha.Id, ConteudoId = conteúdo.Id, Ordem = ordem++ });
        }
        await db.SaveChangesAsync();
        return Ok(new { success = true, trilhaId = trilha.Id, itens = ordem - 1 });
    }
}

[ApiController, Route("api/cronograma")]
public class CronogramaEstudoController(AppDbContext db, FirebaseAuthService auth) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(DateOnly? inicio, DateOnly? fim)
    {
        var user = await auth.ResolveAsync(Request);
        if (user == null) return Unauthorized(new { success = false, message = "Não autenticado." });
        var from = inicio ?? DateOnly.FromDateTime(DateTime.Today);
        var to = fim ?? from.AddDays(14);
        var data = await db.Cronogramas.Where(c => c.FirebaseUid == user.Uid && c.Data >= from && c.Data <= to)
            .OrderBy(c => c.Data).ThenBy(c => c.Id).Select(c => new
            {
                c.Id, c.Data, c.Titulo, c.MinutosPlanejados, c.Concluido, c.Percentual,
                disciplina = c.Disciplina!.Nome, tema = c.Tema != null ? c.Tema.Nome : null, c.ConteudoId
            }).ToListAsync();
        return Ok(new { success = true, data });
    }

    [HttpPost("gerar")]
    public async Task<IActionResult> Gerar([FromBody] GerarCronogramaRequest req)
    {
        var user = await auth.ResolveAsync(Request);
        if (user == null) return Unauthorized(new { success = false, message = "Não autenticado." });
        if (req.DiasSemana.Length == 0) return BadRequest(new { success = false, message = "Escolha ao menos um dia da semana." });

        var hoje = DateOnly.FromDateTime(DateTime.Today);
        var limite = hoje.AddDays(Math.Clamp(req.DiasParaGerar, 7, 90));
        if (req.DataProva < limite) limite = req.DataProva;
        var allowed = req.DiasSemana.Select(x => Math.Clamp(x, 0, 6)).ToHashSet();
        var prioridades = req.DisciplinasDificuldade.ToHashSet(StringComparer.OrdinalIgnoreCase);
        var disciplinas = await db.Disciplinas.Where(d => d.Ativa).OrderBy(d => d.Ordem).ToListAsync();
        disciplinas = disciplinas.OrderByDescending(d => prioridades.Contains(d.Nome)).ThenBy(d => d.Ordem).ToList();
        if (disciplinas.Count == 0) return BadRequest(new { success = false, message = "Nenhuma disciplina cadastrada." });

        var antigos = await db.Cronogramas.Where(c => c.FirebaseUid == user.Uid && c.Data >= hoje && c.GeradoAutomaticamente && !c.Concluido).ToListAsync();
        db.Cronogramas.RemoveRange(antigos);

        var cursor = 0;
        var gerados = 0;
        for (var date = hoje; date <= limite; date = date.AddDays(1))
        {
            if (!allowed.Contains((int)date.DayOfWeek)) continue;
            var disciplina = disciplinas[cursor++ % disciplinas.Count];
            var conteúdos = await db.Conteudos.Where(c => c.Ativo && c.Tema!.DisciplinaId == disciplina.Id).OrderBy(c => c.Tema!.Ordem).ThenBy(c => c.Id).ToListAsync();
            var conteúdo = conteúdos.Count > 0 ? conteúdos[gerados % conteúdos.Count] : null;
            db.Cronogramas.Add(new CronogramaEstudo
            {
                FirebaseUid = user.Uid, Data = date, DisciplinaId = disciplina.Id,
                TemaId = conteúdo?.TemaId, ConteudoId = conteúdo?.Id,
                Titulo = conteúdo?.Titulo ?? $"Revisão de {disciplina.Nome}",
                MinutosPlanejados = Math.Clamp(req.MinutosPorDia, 20, 600), GeradoAutomaticamente = true
            });
            gerados++;
        }
        await db.SaveChangesAsync();
        return Ok(new { success = true, gerados });
    }

    [HttpPatch("{id:int}/concluir")]
    public async Task<IActionResult> Concluir(int id)
    {
        var user = await auth.ResolveAsync(Request);
        if (user == null) return Unauthorized(new { success = false, message = "Não autenticado." });
        var item = await db.Cronogramas.FirstOrDefaultAsync(c => c.Id == id && c.FirebaseUid == user.Uid);
        if (item == null) return NotFound(new { success = false, message = "Sessão não encontrada." });
        item.Concluido = true; item.Percentual = 100;
        if (item.ConteudoId != null)
        {
            var progress = await db.Progressos.FirstOrDefaultAsync(p => p.FirebaseUid == user.Uid && p.ConteudoId == item.ConteudoId);
            if (progress == null) { progress = new ProgressoConteudo { FirebaseUid = user.Uid, ConteudoId = item.ConteudoId.Value }; db.Progressos.Add(progress); }
            progress.Percentual = 100; progress.Concluido = true; progress.AtualizadoEm = DateTime.UtcNow;
        }
        await db.SaveChangesAsync();
        return Ok(new { success = true });
    }
}
