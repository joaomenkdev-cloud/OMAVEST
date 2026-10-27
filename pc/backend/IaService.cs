using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;

namespace Omavest.Services;

/// <summary>
/// IA do OMAVEST: explicação de questões e correção de redação.
/// Usa a Groq Cloud quando a variável GROQ_API_KEY está definida e, caso contrário
/// (ou se a Groq estiver fora do ar), responde com um modo local — assim a
/// demonstração nunca fica quebrada sem internet ou sem chave.
/// </summary>
public class IaService
{
    private static readonly HttpClient Http = new() { Timeout = TimeSpan.FromSeconds(40) };
    private const string GroqUrl = "https://api.groq.com/openai/v1/chat/completions";
    private static readonly string[] Modelos = { "llama-3.3-70b-versatile", "llama-3.1-8b-instant" };

    private readonly string _apiKey = Environment.GetEnvironmentVariable("GROQ_API_KEY")?.Trim() ?? "";

    public bool Configurada => !string.IsNullOrEmpty(_apiKey);

    /// <summary>Chama a Groq. Retorna null se não houver chave ou se todos os modelos falharem.</summary>
    public async Task<string?> ConversarAsync(string system, string user, int maxTokens, double temperatura = 0.6)
    {
        if (!Configurada) return null;

        foreach (var modelo in Modelos)
        {
            try
            {
                var body = JsonSerializer.Serialize(new
                {
                    model = modelo,
                    messages = new[]
                    {
                        new { role = "system", content = system },
                        new { role = "user",   content = user }
                    },
                    max_tokens = maxTokens,
                    temperature = temperatura
                });

                using var req = new HttpRequestMessage(HttpMethod.Post, GroqUrl);
                req.Headers.Add("Authorization", $"Bearer {_apiKey}");
                req.Content = new StringContent(body, Encoding.UTF8, "application/json");

                using var resp = await Http.SendAsync(req);
                var json = await resp.Content.ReadAsStringAsync();
                if (!resp.IsSuccessStatusCode)
                {
                    Console.WriteLine($"[IA] Groq {modelo} respondeu {(int)resp.StatusCode}");
                    continue;
                }

                using var doc = JsonDocument.Parse(json);
                return doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[IA] Falha ao chamar Groq ({modelo}): {ex.Message}");
            }
        }
        return null;
    }

    // ════════════════════════════════════════════════════════
    //  MODO LOCAL — explicação de questão
    // ════════════════════════════════════════════════════════
    public static string ExplicacaoLocal(string prompt)
    {
        string? correta = Regex.Match(prompt, @"RESPOSTA CORRETA:\s*([A-E])", RegexOptions.IgnoreCase).Groups[1].Value.ToUpper();
        string? aluno   = Regex.Match(prompt, @"RESPOSTA DO ALUNO:\s*([A-E])", RegexOptions.IgnoreCase).Groups[1].Value.ToUpper();

        var alts = new Dictionary<string, string>();
        foreach (Match m in Regex.Matches(prompt, @"^([A-E])\)\s*(.+)$", RegexOptions.Multiline))
            alts[m.Groups[1].Value.ToUpper()] = m.Groups[2].Value.Trim();

        alts.TryGetValue(correta ?? "", out var txtCorreta);
        alts.TryGetValue(aluno ?? "", out var txtAluno);

        var sb = new StringBuilder();
        sb.AppendLine($"1) Por que a alternativa {correta} está correta");
        sb.AppendLine(string.IsNullOrEmpty(txtCorreta)
            ? "O gabarito oficial indica essa alternativa como a que melhor responde ao enunciado."
            : $"A alternativa {correta} (\"{Resumir(txtCorreta)}\") é a que atende exatamente ao que o enunciado pede, sem exageros nem informações a mais.");
        sb.AppendLine();
        sb.AppendLine("2) Como chegar nessa resposta");
        sb.AppendLine("• Leia o comando da questão e sublinhe a palavra-chave (o que ela realmente pergunta).");
        sb.AppendLine("• Elimine primeiro as alternativas que contradizem o texto ou o conceito central.");
        sb.AppendLine("• Compare as que sobraram e fique com a que responde ao enunciado por completo.");
        sb.AppendLine();
        sb.AppendLine($"3) Por que a alternativa {aluno} não serve");
        sb.AppendLine(string.IsNullOrEmpty(txtAluno)
            ? "A alternativa marcada não responde ao que foi perguntado."
            : $"A alternativa {aluno} (\"{Resumir(txtAluno)}\") parece plausível, mas não corresponde ao que o enunciado pede: revise o conceito envolvido e compare com a alternativa {correta}.");
        sb.AppendLine();
        sb.Append("💡 Dica: refaça a questão sem olhar o gabarito e anote o conceito no seu caderno de erros.");
        return sb.ToString();
    }

    private static string Resumir(string s) => s.Length <= 90 ? s : s[..90].TrimEnd() + "…";

    // ════════════════════════════════════════════════════════
    //  MODO LOCAL — correção de redação (estimativa por heurísticas)
    // ════════════════════════════════════════════════════════
    private static readonly string[] Conectivos =
    {
        "portanto", "porém", "contudo", "entretanto", "todavia", "além disso", "dessa forma", "desse modo",
        "ademais", "assim", "logo", "pois", "porque", "visto que", "uma vez que", "sobretudo", "outrossim",
        "diante disso", "nesse sentido", "em suma", "por fim", "primeiramente", "em primeiro lugar", "por outro lado",
        "dado que", "ainda que", "embora", "sendo assim", "isto posto", "com efeito", "haja vista"
    };

    private static readonly string[] Repertorio =
    {
        "segundo", "de acordo com", "constituição", "filósofo", "sociólogo", "bauman", "durkheim", "kant", "hobbes",
        "rousseau", "marx", "foucault", "iluminismo", "ibge", "oms", "onu", "pesquisa", "dados", "estudo",
        "lei", "artigo", "declaração universal", "história", "revolução", "literatura", "obra"
    };

    private static readonly string[] AgentesIntervencao =
    {
        "governo", "ministério", "poder público", "estado", "escola", "mídia", "sociedade", "ongs", "empresas",
        "congresso", "prefeitura", "família", "instituições"
    };

    public static object RedacaoLocal(string tema, string texto)
    {
        var t = texto.Trim();
        var minusculo = t.ToLowerInvariant();
        var palavras = Regex.Matches(t, @"\p{L}[\p{L}'-]*").Count;
        var paragrafos = Regex.Split(t, @"\n\s*\n|\r\n\s*\r\n").Count(p => p.Trim().Length > 20);
        if (paragrafos < 2) paragrafos = Math.Max(1, t.Split('\n', StringSplitOptions.RemoveEmptyEntries).Length);
        var frases = Math.Max(1, Regex.Split(t, @"[.!?]+\s").Count(f => f.Trim().Length > 3));
        var mediaFrase = palavras / (double)frases;

        int nConectivos = Conectivos.Count(c => minusculo.Contains(c));
        int nRepertorio = Repertorio.Count(r => minusculo.Contains(r));
        bool temAgente  = AgentesIntervencao.Any(a => minusculo.Contains(a));
        bool temAcao    = Regex.IsMatch(minusculo, @"\b(deve|devem|cabe|é necessário|criar|promover|implementar|investir|ampliar|garantir|fiscalizar)\b");
        bool temMeio    = Regex.IsMatch(minusculo, @"por meio de|mediante|através de|a partir de|via\b");
        bool temFinalidade = Regex.IsMatch(minusculo, @"a fim de|com o intuito de|com o objetivo de|para que|de modo a");
        int itensProposta = new[] { temAgente, temAcao, temMeio, temFinalidade }.Count(b => b);

        // palavras do tema presentes no texto
        var palavrasTema = Regex.Matches(tema.ToLowerInvariant(), @"\p{L}{5,}").Select(m => m.Value).Distinct().ToList();
        int temaCobertas = palavrasTema.Count(p => minusculo.Contains(p[..Math.Min(p.Length, 6)]));
        double coberturaTema = palavrasTema.Count == 0 ? 0.5 : temaCobertas / (double)palavrasTema.Count;

        // erros "grosseiros" detectáveis
        int erros = 0;
        erros += Regex.Matches(t, @"  +").Count;
        erros += Regex.Matches(t, @"(?<=[.!?]\s)[a-zà-ú]").Count;           // frase começando com minúscula
        erros += Regex.Matches(minusculo, @"\b(a nível de|houveram|fazem \d+ anos|mal educado|tampouco que)\b").Count;
        erros += Regex.Matches(t, @"\b(vc|pq|tb|q|n)\b", RegexOptions.IgnoreCase).Count;

        int Arred(double v) => Math.Clamp((int)Math.Round(v / 40.0) * 40, 0, 200);

        // Tamanho mínimo: textos muito curtos nunca passam de 40-80 por competência
        double fatorTamanho = palavras < 60 ? 0.2 : palavras < 150 ? 0.5 : palavras < 230 ? 0.8 : 1.0;

        int c1 = Arred((200 - Math.Min(erros, 8) * 22 - (mediaFrase > 38 ? 30 : 0)) * Math.Max(fatorTamanho, 0.4));
        int c2 = Arred(200 * (0.35 + 0.65 * coberturaTema) * (0.55 + 0.15 * Math.Min(nRepertorio, 3)) * fatorTamanho);
        int c3 = Arred(200 * (0.4 + 0.2 * Math.Min(paragrafos, 4) / 4.0 * 3 + 0.1 * Math.Min(nRepertorio, 3)) * fatorTamanho);
        int c4 = Arred(200 * Math.Min(1.0, 0.2 + nConectivos / 9.0) * Math.Max(fatorTamanho, 0.3));
        int c5 = Arred(200 * (itensProposta / 4.0) * Math.Max(fatorTamanho, 0.3));
        if (palavras < 30) { c1 = c2 = c3 = c4 = c5 = 0; }

        var comp = new[]
        {
            new { nome = "Domínio da norma culta", nota = c1, feedback =
                erros == 0 ? "Não foram detectados desvios gramaticais evidentes. Continue revisando concordância e pontuação."
                           : $"Foram encontrados indícios de {erros} desvio(s) (espaços duplos, frases iniciadas em minúscula, abreviações de internet ou expressões inadequadas). Revise antes de entregar." },
            new { nome = "Compreensão do tema", nota = c2, feedback =
                coberturaTema >= 0.6 ? "O texto dialoga bem com as palavras-chave do tema. Reforce com repertório sociocultural legítimo (dados, leis, autores)."
                                     : "Poucos termos do tema aparecem no texto. Retome o recorte da proposta na introdução e ao longo dos parágrafos para evitar tangenciamento." },
            new { nome = "Seleção de argumentos", nota = c3, feedback =
                paragrafos >= 4 ? "A estrutura em parágrafos está adequada. Garanta que cada desenvolvimento tenha tese + argumento + exemplo."
                                : "Estruture em 4 parágrafos: introdução com tese, dois desenvolvimentos com argumentos e conclusão com proposta." },
            new { nome = "Coesão textual", nota = c4, feedback =
                nConectivos >= 6 ? "Bom uso de conectivos para ligar as ideias. Varie-os para não repetir."
                                 : $"Foram identificados {nConectivos} conectivos. Use mais articuladores (portanto, além disso, contudo, nesse sentido) entre parágrafos e períodos." },
            new { nome = "Proposta de intervenção", nota = c5, feedback =
                itensProposta == 4 ? "Proposta completa: agente, ação, meio e finalidade identificados."
                                   : "A proposta deve ter 5 elementos: agente, ação, meio/modo, finalidade e detalhamento. Faltam: " +
                                     string.Join(", ", new[] { (!temAgente, "agente"), (!temAcao, "ação"), (!temMeio, "meio/modo"), (!temFinalidade, "finalidade") }.Where(x => x.Item1).Select(x => x.Item2)) + "." }
        };

        int total = comp.Sum(c => c.nota);
        var geral = $"Estimativa automática (modo offline, sem IA): {palavras} palavras, {paragrafos} parágrafo(s), {nConectivos} conectivos e {nRepertorio} marcador(es) de repertório. " +
                    (total >= 800 ? "Texto muito bem estruturado."
                   : total >= 600 ? "Texto consistente, com pontos claros de evolução."
                   : total >= 400 ? "Texto mediano: reforce argumentação e proposta de intervenção."
                   : "Texto ainda curto ou pouco desenvolvido para o padrão ENEM.");

        var melhorar = new StringBuilder();
        if (palavras < 230) melhorar.AppendLine("• Amplie o texto: mire entre 25 e 30 linhas (cerca de 250–350 palavras).");
        if (paragrafos < 4) melhorar.AppendLine("• Organize em introdução, dois desenvolvimentos e conclusão.");
        if (nConectivos < 6) melhorar.AppendLine("• Use mais conectivos entre parágrafos e períodos.");
        if (nRepertorio < 2) melhorar.AppendLine("• Inclua repertório sociocultural (dado, lei, autor, fato histórico) e relacione ao tema.");
        if (itensProposta < 4) melhorar.AppendLine("• Complete a proposta de intervenção: agente + ação + meio + finalidade + detalhamento.");
        if (erros > 0) melhorar.AppendLine("• Releia o texto em voz alta e corrija pontuação, acentos e abreviações.");
        if (melhorar.Length == 0) melhorar.AppendLine("• Continue treinando com temas diferentes e peça correção humana para comparar.");

        return new
        {
            nota_total = total,
            competencias = comp,
            avaliacao_geral = geral,
            como_melhorar = melhorar.ToString().TrimEnd(),
            modo = "local"
        };
    }
}

