using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Omavest.Data;
using Omavest.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("Default") ?? "Data Source=omavest.db"));

builder.Services.AddCors(options => options.AddDefaultPolicy(policy => policy
    .SetIsOriginAllowed(origin =>
        origin.StartsWith("http://localhost", StringComparison.OrdinalIgnoreCase) ||
        origin.StartsWith("https://localhost", StringComparison.OrdinalIgnoreCase))
    .AllowAnyHeader().AllowAnyMethod()));

builder.Services.AddHttpClient("AI", client => client.Timeout = TimeSpan.FromSeconds(90));
builder.Services.AddHttpClient("PdfImport", client =>
{
    client.Timeout = TimeSpan.FromMinutes(3);
    client.DefaultRequestHeaders.UserAgent.ParseAdd("OMAVEST/2.0 educational-platform");
});

builder.Services.AddSingleton<FirebaseAuthService>();
builder.Services.AddScoped<EmbeddingService>();
builder.Services.AddScoped<ChatService>();
builder.Services.AddScoped<RagService>();
builder.Services.AddScoped<PdfImportService>();

builder.Services.AddControllers().AddJsonOptions(o =>
    o.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase);
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c => c.SwaggerDoc("v2", new()
{
    Title = "OMAVEST API",
    Version = "v2",
    Description = "API educacional do OMAVEST: acervo, progresso, trilhas, cronograma, simulados e RAG."
}));

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.EnsureCreatedAsync();
    await DbSeeder.SeedAsync(db);
    var rag = scope.ServiceProvider.GetRequiredService<RagService>();
    await rag.EnsureIndexAsync();
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v2/swagger.json", "OMAVEST API v2"));
}

app.UseCors();

var siteFolder = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), ".."));
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(siteFolder),
    RequestPath = ""
});

app.MapGet("/", () => Results.Redirect("/html/index.html"));
app.MapGet("/health", () => Results.Ok(new { status = "ok", app = "OMAVEST", version = "2.0" }));
app.MapControllers();

Console.WriteLine("OMAVEST 2.0 iniciado em http://localhost:5000");
Console.WriteLine("Swagger em ambiente Development: http://localhost:5000/swagger");
app.Run("http://0.0.0.0:5000");
