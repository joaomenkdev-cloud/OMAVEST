using System.Net.Http.Json;
using System.Net.Http.Headers;
using System.Text.Json;

namespace Omavest.Services;

public class ChatService(IHttpClientFactory httpFactory, IConfiguration config, ILogger<ChatService> logger)
{
    private readonly HttpClient _http = httpFactory.CreateClient("AI");
    private readonly string? _apiKey = config["AI:ChatApiKey"] ?? Environment.GetEnvironmentVariable("OMAVEST_CHAT_API_KEY");
    private readonly string _endpoint = config["AI:ChatEndpoint"] ?? "https://api.groq.com/openai/v1/chat/completions";
    private readonly string _model = config["AI:ChatModel"] ?? "llama-3.3-70b-versatile";

    public bool IsConfigured => !string.IsNullOrWhiteSpace(_apiKey);

    public async Task<string?> CompleteAsync(string systemPrompt, string userPrompt, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_apiKey)) return null;

        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, _endpoint);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
            request.Content = JsonContent.Create(new
            {
                model = _model,
                temperature = 0.25,
                messages = new object[]
                {
                    new { role = "system", content = systemPrompt },
                    new { role = "user", content = userPrompt }
                }
            });
            using var response = await _http.SendAsync(request, cancellationToken);
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            response.EnsureSuccessStatusCode();
            using var json = JsonDocument.Parse(body);
            return json.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Falha ao consultar o modelo de linguagem.");
            return null;
        }
    }
}
