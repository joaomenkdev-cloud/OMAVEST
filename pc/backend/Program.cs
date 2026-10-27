using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Omavest.Data;
using Omavest.Services;

// Garante acentos e símbolos corretos no terminal do Windows
Console.OutputEncoding = Encoding.UTF8;

var builder = WebApplication.CreateBuilder(args);

// ── Banco de dados SQLite ──────────────────────────────────────
// O arquivo fica sempre ao lado do projeto, não importa de onde o comando for executado.
var dbPath = Path.Combine(builder.Environment.ContentRootPath, "omavest.db");
builder.Services.AddDbContext<AppDbContext>(opt => opt.UseSqlite($"Data Source={dbPath}"));

// ── CORS ───────────────────────────────────────────────────────
builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));

// ── HttpClient para download de PDFs (PdfImportService) ───────
builder.Services.AddHttpClient("PdfImport", client =>
{
    client.Timeout = TimeSpan.FromMinutes(5);
    client.DefaultRequestHeaders.Add("User-Agent",
        "Mozilla/5.0 (compatible; OMAVEST/1.0; +https://omavest.com.br)");
    client.DefaultRequestHeaders.Add("Accept", "application/pdf,*/*");
});

// ── Serviços ───────────────────────────────────────────────────
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<PdfImportService>();   // importação de PDFs
builder.Services.AddSingleton<IaService>();        // explicações e correção de redação

// A API mantém os nomes das propriedades em PascalCase (NumeroInscricao, Nome...), padrão esperado pelo app mobile.
builder.Services.AddControllers().AddJsonOptions(o =>
{
    o.JsonSerializerOptions.PropertyNamingPolicy = null;
    o.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "OMAVEST API", Version = "v1",
        Description = "API para gestão do processo seletivo e simulados." });
});

var app = builder.Build();

// ── Criar BD e popular dados iniciais ──────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
    await DbSeeder.SeedAsync(db);
    await DbSeeder.SeedDemoUserAsync(db);
}

// Swagger fica ligado também na apresentação (útil para mostrar a API)
app.UseSwagger();
app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "OMAVEST API v1"));

app.UseCors();

// ── Servir arquivos estáticos (HTML, CSS, JS, assets) ──────────
// A pasta "pc" (pai de backend/) contém html/, css/, js/ e assets/.
var siteFolder = Path.GetFullPath(Path.Combine(builder.Environment.ContentRootPath, ".."));
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(siteFolder),
    RequestPath = ""
});

// Redirecionar / para a página inicial
app.MapGet("/", () => Results.Redirect("/html/index.html"));

app.MapControllers();

var url = Environment.GetEnvironmentVariable("OMAVEST_URL") ?? "http://0.0.0.0:5000";

Console.WriteLine();
Console.WriteLine("  ╔══════════════════════════════════════════════╗");
Console.WriteLine("  ║              O M A V E S T   v4.0            ║");
Console.WriteLine("  ╠══════════════════════════════════════════════╣");
Console.WriteLine("  ║  Site:    http://localhost:5000              ║");
Console.WriteLine("  ║  API:     http://localhost:5000/swagger      ║");
Console.WriteLine("  ║  Banco:   SQLite (omavest.db)                ║");
Console.WriteLine("  ╠══════════════════════════════════════════════╣");
Console.WriteLine("  ║  Conta demo:  demo@omavest.com / 123456      ║");
Console.WriteLine("  ╚══════════════════════════════════════════════╝");
Console.WriteLine();

app.Run(url);
