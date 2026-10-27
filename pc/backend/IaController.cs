using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using Omavest.Services;

namespace Omavest.Controllers;

public record ExplicacaoRequest(string Prompt);
public record RedacaoRequest(string Tema, string Texto);

[ApiController, Route("api/ia")]
public class IaController(IaService ia) : ControllerBase
{
    [HttpGet("status")]
    public IActionResult Status() => Ok(new { success = true, groq = ia.Configurada, modo = ia.Configurada ? "groq" : "local" });

    [HttpPost("explicacao")]
    public async Task<IActionResult> Explicacao([FromBody] ExplicacaoRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Prompt))
            return BadRequest(new { success = false, message = "Prompt vazio." });
        if (req.Prompt.Length > 8000)
            return BadRequest(new { success = false, message = "Prompt muito longo." });

        var texto = await ia.ConversarAsync(
            "Você é um professor expert em vestibulares brasileiros (ENEM, FUVEST, UNICAMP). Explique questões de forma clara, didática e objetiva em português.",
            req.Prompt, 800, 0.6);

        if (!string.IsNullOrWhiteSpace(texto))
            return Ok(new { success = true, texto, modo = "groq" });

        return Ok(new { success = true, texto = IaService.ExplicacaoLocal(req.Prompt), modo = "local" });
    }

    [HttpPost("redacao")]
    public async Task<IActionResult> Redacao([FromBody] RedacaoRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Texto))
            return BadRequest(new { success = false, message = "Escreva a redação antes de enviar." });
        if (req.Texto.Length > 12000)
            return BadRequest(new { success = false, message = "Texto muito longo." });

        const string system = """
            Você é um avaliador de redações do ENEM e segue a Cartilha do INEP. Avalie 5 competências (0 a 200, múltiplos de 40).
            Responda SOMENTE com JSON puro (sem markdown), neste formato exato:
            {"nota_total": número 0-1000,
             "competencias":[
              {"nome":"Domínio da norma culta","nota":número,"feedback":"texto"},
              {"nome":"Compreensão do tema","nota":número,"feedback":"texto"},
              {"nome":"Seleção de argumentos","nota":número,"feedback":"texto"},
              {"nome":"Coesão textual","nota":número,"feedback":"texto"},
              {"nome":"Proposta de intervenção","nota":número,"feedback":"texto"}],
             "avaliacao_geral":"parágrafo",
             "como_melhorar":"3 a 5 ações, uma por linha começando com •"}
            """;

        var bruto = await ia.ConversarAsync(system, $"Tema: \"{req.Tema}\"\n\nRedação do candidato:\n{req.Texto}", 1200, 0.3);
        if (!string.IsNullOrWhiteSpace(bruto))
        {
            try
            {
                var limpo = Regex.Replace(bruto, "```json|```", "").Trim();
                var ini = limpo.IndexOf('{'); var fim = limpo.LastIndexOf('}');
                if (ini >= 0 && fim > ini) limpo = limpo[ini..(fim + 1)];
                using var doc = JsonDocument.Parse(limpo);
                var obj = JsonSerializer.Deserialize<Dictionary<string, object>>(limpo)!;
                obj["modo"] = "groq";
                return Ok(obj);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[IA] Resposta de redação inválida: {ex.Message}");
            }
        }
        return Ok(IaService.RedacaoLocal(req.Tema ?? "", req.Texto));
    }
}
