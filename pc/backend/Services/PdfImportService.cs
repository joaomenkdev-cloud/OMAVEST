using Microsoft.EntityFrameworkCore;
using Omavest.Data;
using Omavest.Models;
using UglyToad.PdfPig;

namespace Omavest.Services;

public class PdfImportService(AppDbContext db, IHttpClientFactory httpFactory, EmbeddingService embeddings)
{
    private readonly HttpClient _http = httpFactory.CreateClient("PdfImport");

    public async Task<(RagDocumento Documento, int Trechos)> ImportarParaRagAsync(string url, string titulo, string fonte, string tipo, CancellationToken cancellationToken = default)
    {
        var bytes = await _http.GetByteArrayAsync(url, cancellationToken);
        using var pdf = PdfDocument.Open(bytes);
        var text = string.Join("\n", pdf.GetPages().Select(p => p.Text));
        if (string.IsNullOrWhiteSpace(text)) throw new InvalidOperationException("O PDF não possui texto extraível.");

        var doc = new RagDocumento { Titulo = titulo, Fonte = fonte, Url = url, Tipo = tipo, Ativo = true };
        db.RagDocumentos.Add(doc);
        await db.SaveChangesAsync(cancellationToken);

        var chunks = Chunk(text, 900).Take(500).ToList();
        for (var i = 0; i < chunks.Count; i++)
        {
            var vector = await embeddings.CreateAsync(chunks[i], cancellationToken);
            db.RagTrechos.Add(new RagTrecho
            {
                RagDocumentoId = doc.Id, Ordem = i, Texto = chunks[i],
                EmbeddingJson = System.Text.Json.JsonSerializer.Serialize(vector)
            });
        }
        await db.SaveChangesAsync(cancellationToken);
        return (doc, chunks.Count);
    }

    private static IEnumerable<string> Chunk(string text, int maxChars)
    {
        var clean = string.Join(" ", text.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));
        for (var start = 0; start < clean.Length; start += maxChars)
        {
            var len = Math.Min(maxChars, clean.Length - start);
            yield return clean.Substring(start, len);
        }
    }
}
