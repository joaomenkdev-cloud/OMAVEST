using FirebaseAdmin;
using FirebaseAdmin.Auth;
using Google.Apis.Auth.OAuth2;

namespace Omavest.Services;

public record AuthenticatedUser(string Uid, string? Email, string Name, bool IsAdmin);

public class FirebaseAuthService
{
    private readonly IWebHostEnvironment _environment;
    private readonly IConfiguration _config;
    private readonly FirebaseApp? _app;

    public bool IsConfigured => _app != null;

    public FirebaseAuthService(IConfiguration config, IWebHostEnvironment environment, ILogger<FirebaseAuthService> logger)
    {
        _config = config;
        _environment = environment;

        var projectId = config["Firebase:ProjectId"];
        var serviceAccountPath = config["Firebase:ServiceAccountPath"];
        var adcPath = Environment.GetEnvironmentVariable("GOOGLE_APPLICATION_CREDENTIALS");

        if (string.IsNullOrWhiteSpace(projectId))
        {
            logger.LogWarning("Firebase não configurado. Defina Firebase:ProjectId para habilitar autenticação real.");
            return;
        }

        try
        {
            GoogleCredential? credential = null;
            var candidate = !string.IsNullOrWhiteSpace(serviceAccountPath) ? serviceAccountPath : adcPath;
            if (!string.IsNullOrWhiteSpace(candidate) && File.Exists(candidate))
                credential = GoogleCredential.FromFile(candidate);

            if (credential == null)
            {
                logger.LogWarning("Firebase ProjectId encontrado, mas nenhuma credencial de serviço foi encontrada. A API continuará sem validar tokens até a credencial ser configurada.");
                return;
            }

            _app = FirebaseApp.Create(new AppOptions
            {
                ProjectId = projectId,
                Credential = credential
            }, "omavest");
        }
        catch (ArgumentException)
        {
            _app = FirebaseApp.GetInstance("omavest");
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Não foi possível inicializar o Firebase Admin.");
        }
    }

    public async Task<AuthenticatedUser?> ResolveAsync(HttpRequest request)
    {
        var authHeader = request.Headers.Authorization.ToString();
        if (authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase) && _app != null)
        {
            var idToken = authHeader[7..].Trim();
            if (!string.IsNullOrWhiteSpace(idToken))
            {
                try
                {
                    var decoded = await FirebaseAuth.GetAuth(_app).VerifyIdTokenAsync(idToken);
                    decoded.Claims.TryGetValue("email", out var emailObj);
                    decoded.Claims.TryGetValue("name", out var nameObj);
                    var isAdmin = decoded.Claims.TryGetValue("admin", out var adminObj) &&
                                  adminObj is bool admin && admin;
                    return new AuthenticatedUser(decoded.Uid, emailObj?.ToString(), nameObj?.ToString() ?? "Estudante", isAdmin);
                }
                catch
                {
                    return null;
                }
            }
        }

        if (_environment.IsDevelopment() && _config.GetValue<bool>("Firebase:AllowDemoAuth"))
            return new AuthenticatedUser("demo", "demo@omavest.local", "Estudante", true);

        return null;
    }
}
