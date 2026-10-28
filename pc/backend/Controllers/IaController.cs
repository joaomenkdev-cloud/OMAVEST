using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using Omavest.Data;
using Omavest.Models;
using Omavest.Services;

namespace Omavest.Controllers;

[ApiController, Route("api/ia")]
public class IaController(AppDbContext db, RagService rag, ChatService chat, FirebaseAuthService auth) : ControllerBase
{
    [HttpPost("perguntar")]
    public async Task<IActionResult> Perguntar([FromBody] PerguntaIaRequest req, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(req.Pergunta) || req.Pergunta.Length < 3)
            return BadRequest(new { success = false, message = "Digite uma pergunta válida." });
        var answer = await rag.AskAsync(req.Pergunta, cancellationToken);
        return Ok(new
        {
            success = true,
            resposta = answer.Resposta,
            geradoPorIa = answer.GeradoPorIa,
            fontes = answer.Fontes.Select(f => new { f.DocumentoId, f.Titulo, f.Fonte, f.Url, similaridade = Math.Round(f.Similaridade, 3) })
        });
    }

    [HttpPost("redacao")]
    public async Task<IActionResult> CorrigirRedacao([FromBody] CorrecaoRedacaoRequest req, CancellationToken cancellationToken)
    {
        var user = await auth.ResolveAsync(Request);
        if (user == null) return Unauthorized(new { success = false, message = "Entre com Firebase para salvar a correção." });
        if (string.IsNullOrWhiteSpace(req.Texto) || req.Texto.Length < 300)
            return BadRequest(new { success = false, message = "A redação precisa ter pelo menos 300 caracteres para uma análise útil." });

        var sources = await rag.SearchAsync($"redação dissertativo argumentativa {req.Tema}", 3, "redacao", cancellationToken);
        var context = string.Join("\n", sources.Select(s => s.Trecho));
        var prompt = $"Tema: {req.Tema}\n\nTexto do estudante:\n{req.Texto}\n\nCritérios recuperados:\n{context}\n\nProduza feedback por aspectos de escrita, tema/argumentação, organização, coesão e proposta de intervenção. Comece com uma linha no formato NOTA_ESTIMADA: N, em que N vai de 0 a 1000 e é apenas uma estimativa educacional.";
        var feedback = await chat.CompleteAsync(
            "Você é um corretor educacional do OMAVEST. A correção é uma estimativa de estudo, não oficial. Seja específico, respeitoso e explique como melhorar. Não afirme que o modelo foi treinado pelo INEP.",
            prompt, cancellationToken);

        feedback ??= "A IA generativa ainda não está configurada. O texto foi salvo, mas para receber uma correção automática configure OMAVEST_CHAT_API_KEY no backend.";
        int? nota = null;
        var match = Regex.Match(feedback, @"NOTA_ESTIMADA:\s*(\d{1,4})", RegexOptions.IgnoreCase);
        if (match.Success && int.TryParse(match.Groups[1].Value, out var parsed)) nota = Math.Clamp(parsed, 0, 1000);

        var redacao = new Redacao { FirebaseUid = user.Uid, Tema = req.Tema, Titulo = req.Titulo, Texto = req.Texto, Feedback = feedback, NotaEstimada = nota };
        db.Redacoes.Add(redacao);
        await db.SaveChangesAsync(cancellationToken);
        return Ok(new
        {
            success = true, redacaoId = redacao.Id, notaEstimada = nota, feedback,
            aviso = "Estimativa educacional. Não substitui uma correção oficial do ENEM ou de outra banca.",
            fontes = sources.Select(s => new { s.Titulo, s.Fonte, s.Url })
        });
    }
}
