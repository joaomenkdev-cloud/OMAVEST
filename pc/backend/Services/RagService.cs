using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Omavest.Data;
using Omavest.Models;

namespace Omavest.Services;

public record RagSource(int DocumentoId, string Titulo, string Fonte, string? Url, string Trecho, double Similaridade);
public record RagAnswer(string Resposta, IReadOnlyList<RagSource> Fontes, bool GeradoPorIa);

public class RagService(AppDbContext db, EmbeddingService embeddings, ChatService chat, ILogger<RagService> logger)
{
    public async Task EnsureIndexAsync(CancellationToken cancellationToken = default)
    {
        if (await db.RagTrechos.AnyAsync(cancellationToken)) return;
        await RebuildAsync(cancellationToken);
    }

    public async Task<int> RebuildAsync(CancellationToken cancellationToken = default)
    {
        db.RagTrechos.RemoveRange(db.RagTrechos);
        db.RagDocumentos.RemoveRange(db.RagDocumentos);
        await db.SaveChangesAsync(cancellationToken);

        var conteudos = await db.Conteudos.Include(c => c.Tema).ThenInclude(t => t!.Disciplina)
            .Where(c => c.Ativo && c.TextoBase != "").ToListAsync(cancellationToken);
        var total = 0;

        foreach (var conteudo in conteudos)
        {
            var doc = new RagDocumento
            {
                Titulo = $"{conteudo.Tema?.Disciplina?.Nome} • {conteudo.Titulo}",
                Fonte = conteudo.Fonte,
                Url = conteudo.Url,
                Tipo = "conteudo"
            };
            db.RagDocumentos.Add(doc);
            await db.SaveChangesAsync(cancellationToken);

            var chunks = Chunk(conteudo.TextoBase, 700);
            for (var i = 0; i < chunks.Count; i++)
            {
                var vector = await embeddings.CreateAsync(chunks[i], cancellationToken);
                db.RagTrechos.Add(new RagTrecho
                {
                    RagDocumentoId = doc.Id,
                    ConteudoId = conteudo.Id,
                    Ordem = i,
                    Texto = chunks[i],
                    EmbeddingJson = JsonSerializer.Serialize(vector)
                });
                total++;
            }
        }

        var redacaoDoc = new RagDocumento
        {
            Titulo = "Guia interno OMAVEST de redação",
            Fonte = "OMAVEST",
            Tipo = "redacao"
        };
        db.RagDocumentos.Add(redacaoDoc);
        await db.SaveChangesAsync(cancellationToken);
        var redacaoTexto = "A avaliação educacional de uma redação dissertativo-argumentativa deve observar domínio da escrita formal, compreensão do tema, organização dos argumentos, coesão entre as partes do texto e qualidade da proposta de intervenção quando ela for exigida. O feedback deve explicar pontos fortes e pontos a melhorar. A nota gerada por IA é apenas estimativa educacional e não substitui a correção oficial de uma banca.";
        var redacaoVector = await embeddings.CreateAsync(redacaoTexto, cancellationToken);
        db.RagTrechos.Add(new RagTrecho { RagDocumentoId = redacaoDoc.Id, Ordem = 0, Texto = redacaoTexto, EmbeddingJson = JsonSerializer.Serialize(redacaoVector) });
        total++;

        await db.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Índice RAG reconstruído com {Total} trechos.", total);
        return total;
    }

    public async Task<IReadOnlyList<RagSource>> SearchAsync(string query, int top = 4, string? tipo = null, CancellationToken cancellationToken = default)
    {
        await EnsureIndexAsync(cancellationToken);
        var queryVector = await embeddings.CreateAsync(query, cancellationToken);
        var rows = await db.RagTrechos.Include(x => x.Documento)
            .Where(x => x.Documento != null && x.Documento.Ativo && (tipo == null || x.Documento.Tipo == tipo))
            .AsNoTracking().ToListAsync(cancellationToken);

        return rows.Select(row =>
            {
                var vector = JsonSerializer.Deserialize<float[]>(row.EmbeddingJson) ?? Array.Empty<float>();
                return new RagSource(row.Documento!.Id, row.Documento.Titulo, row.Documento.Fonte, row.Documento.Url, row.Texto, Cosine(queryVector, vector));
            })
            .OrderByDescending(x => x.Similaridade)
            .Take(Math.Clamp(top, 1, 8))
            .ToList();
    }

    public async Task<RagAnswer> AskAsync(string question, CancellationToken cancellationToken = default)
    {
        var sources = await SearchAsync(question, 4, "conteudo", cancellationToken);
        var context = string.Join("\n\n", sources.Select((s, i) => $"FONTE {i + 1}: {s.Titulo}\n{s.Trecho}"));
        var prompt = $"Pergunta do estudante: {question}\n\nContexto recuperado:\n{context}";
        var response = await chat.CompleteAsync(
            "Você é o assistente pedagógico do OMAVEST. Responda em português do Brasil, de forma didática e curta. Use apenas o contexto recuperado. Se o contexto não for suficiente, diga isso explicitamente. Não invente fontes nem informações.",
            prompt, cancellationToken);

        if (!string.IsNullOrWhiteSpace(response))
            return new RagAnswer(response, sources, true);

        var fallback = sources.Count == 0
            ? "Não encontrei conteúdo suficiente no acervo para responder essa dúvida ainda."
            : "A IA generativa ainda não está configurada neste ambiente. Estes são os trechos mais relevantes encontrados no acervo:\n\n" +
              string.Join("\n\n", sources.Select(s => $"• {s.Titulo}: {s.Trecho}"));
        return new RagAnswer(fallback, sources, false);
    }

    private static List<string> Chunk(string text, int maxChars)
    {
        var normalized = string.Join(" ", text.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));
        if (normalized.Length <= maxChars) return new List<string> { normalized };

        var chunks = new List<string>();
        var start = 0;
        while (start < normalized.Length)
        {
            var length = Math.Min(maxChars, normalized.Length - start);
            var end = start + length;
            if (end < normalized.Length)
            {
                var lastSpace = normalized.LastIndexOf(' ', end - 1, length);
                if (lastSpace > start + maxChars / 2) end = lastSpace;
            }
            chunks.Add(normalized[start..end].Trim());
            start = end;
        }
        return chunks;
    }

    private static double Cosine(float[] a, float[] b)
    {
        if (a.Length == 0 || b.Length == 0 || a.Length != b.Length) return 0;
        double dot = 0, na = 0, nb = 0;
        for (var i = 0; i < a.Length; i++)
        {
            dot += a[i] * b[i];
            na += a[i] * a[i];
            nb += b[i] * b[i];
        }
        return na == 0 || nb == 0 ? 0 : dot / (Math.Sqrt(na) * Math.Sqrt(nb));
    }
}
