using Microsoft.AspNetCore.Mvc;
using Omavest.Data;
using Omavest.Models;
using Omavest.Services;

namespace Omavest.Controllers;

[ApiController, Route("api/admin")]
public class AdminController(AppDbContext db, FirebaseAuthService auth, RagService rag, PdfImportService pdf) : ControllerBase
{
    [HttpPost("rag/reindexar")]
    public async Task<IActionResult> Reindexar(CancellationToken cancellationToken)
    {
        var user = await auth.ResolveAsync(Request);
        if (user is not { IsAdmin: true }) return StatusCode(403, new { success = false, message = "Acesso de administrador necessário." });
        var total = await rag.RebuildAsync(cancellationToken);
        return Ok(new { success = true, trechos = total });
    }

    [HttpPost("rag/importar-pdf")]
    public async Task<IActionResult> ImportarPdf([FromBody] ImportarPdfRequest req, CancellationToken cancellationToken)
    {
        var user = await auth.ResolveAsync(Request);
        if (user is not { IsAdmin: true }) return StatusCode(403, new { success = false, message = "Acesso de administrador necessário." });
        var result = await pdf.ImportarParaRagAsync(req.Url, req.Titulo, req.Fonte, req.Tipo, cancellationToken);
        return Ok(new { success = true, documentoId = result.Documento.Id, trechos = result.Trechos });
    }

    [HttpPost("conteudos")]
    public async Task<IActionResult> CriarConteudo([FromBody] Conteudo input, CancellationToken cancellationToken)
    {
        var user = await auth.ResolveAsync(Request);
        if (user is not { IsAdmin: true }) return StatusCode(403, new { success = false, message = "Acesso de administrador necessário." });
        input.Id = 0;
        input.CriadoEm = DateTime.UtcNow;
        db.Conteudos.Add(input);
        await db.SaveChangesAsync(cancellationToken);
        await rag.RebuildAsync(cancellationToken);
        return Ok(new { success = true, data = input });
    }
}
