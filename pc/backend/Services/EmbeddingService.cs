using System.Net.Http.Json;
using System.Globalization;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace Omavest.Services;

public class EmbeddingService(IHttpClientFactory httpFactory, IConfiguration config, ILogger<EmbeddingService> logger)
{
    private readonly HttpClient _http = httpFactory.CreateClient("AI");
    private readonly string? _apiKey = config["AI:EmbeddingApiKey"] ?? Environment.GetEnvironmentVariable("OMAVEST_EMBEDDING_API_KEY");
    private readonly string _endpoint = config["AI:EmbeddingEndpoint"] ?? "https://api.openai.com/v1/embeddings";
    private readonly string _model = config["AI:EmbeddingModel"] ?? "text-embedding-3-small";
    private const int LocalDimensions = 384;

    public async Task<float[]> CreateAsync(string text, CancellationToken cancellationToken = default)
    {
        if (!string.IsNullOrWhiteSpace(_apiKey))
        {
            try
            {
                using var request = new HttpRequestMessage(HttpMethod.Post, _endpoint);
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
                request.Content = JsonContent.Create(new { model = _model, input = text });
                using var response = await _http.SendAsync(request, cancellationToken);
                response.EnsureSuccessStatusCode();
                using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));
                return json.RootElement.GetProperty("data")[0].GetProperty("embedding")
                    .EnumerateArray().Select(x => x.GetSingle()).ToArray();
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Falha ao gerar embedding remoto. Usando embedding local de fallback.");
            }
        }

        return CreateLocal(text);
    }

    private static float[] CreateLocal(string text)
    {
        var vector = new float[LocalDimensions];
        var normalized = RemoveDiacritics(text.ToLowerInvariant());
        foreach (Match match in Regex.Matches(normalized, @"[a-z0-9]{2,}"))
        {
            var token = match.Value;
            var hash = SHA256.HashData(Encoding.UTF8.GetBytes(token));
            var raw = BitConverter.ToUInt32(hash, 0);
            var index = (int)(raw % LocalDimensions);
            var sign = (hash[4] & 1) == 0 ? 1f : -1f;
            vector[index] += sign;
        }

        var norm = MathF.Sqrt(vector.Sum(v => v * v));
        if (norm > 0)
            for (var i = 0; i < vector.Length; i++) vector[i] /= norm;
        return vector;
    }

    private static string RemoveDiacritics(string text)
    {
        var formD = text.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder();
        foreach (var c in formD)
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark) sb.Append(c);
        return sb.ToString().Normalize(NormalizationForm.FormC);
    }
}
