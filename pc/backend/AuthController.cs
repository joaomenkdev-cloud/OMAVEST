using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Omavest.Data;
using Omavest.Models;
using Omavest.Services;

namespace Omavest.Controllers;

public record RegistrarRequest(string Nome, string Email, string Senha);

/// <summary>Login por e-mail OU número de inscrição (campo "identificador").</summary>
public record LoginRequest(string? Identificador, string? Email, string? NumeroInscricao, string Senha);

public record TrocarSenhaRequest(
    [property: JsonPropertyName("senha_atual")] string? SenhaAtual,
    [property: JsonPropertyName("senha_nova")] string SenhaNova);

// ══════════════════════════════════════════════════════════════
//  AUTENTICAÇÃO (contas locais — funciona sem Firebase)
// ══════════════════════════════════════════════════════════════
[ApiController, Route("api/auth")]
public partial class AuthController(AppDbContext db, AuthService auth) : ControllerBase
{
    [GeneratedRegex(@"^[^\s@]+@[^\s@]+\.[^\s@]+$")]
    private static partial Regex EmailRegex();

    // Formato PascalCase: o mesmo usado pelo app mobile e pelo restante da API
    private static object UsuarioDto(Usuario u) => new
    {
        u.NumeroInscricao,
        u.Nome,
        u.Email,
        u.CriadoEm,
        primeiro_acesso = u.PrimeiroAcesso
    };

    // ── Cadastro de conta ────────────────────────────────────
    [HttpPost("registrar")]
    public async Task<IActionResult> Registrar([FromBody] RegistrarRequest req)
    {
        var nome  = (req.Nome ?? "").Trim();
        var email = (req.Email ?? "").Trim().ToLowerInvariant();

        if (nome.Length < 2)
            return BadRequest(new { success = false, message = "Informe seu nome." });
        if (!EmailRegex().IsMatch(email))
            return BadRequest(new { success = false, message = "E-mail inválido." });
        if ((req.Senha ?? "").Length < 8)
            return BadRequest(new { success = false, message = "A senha precisa ter no mínimo 8 caracteres." });
        if (await db.Usuarios.AnyAsync(x => x.Email == email))
            return Conflict(new { success = false, message = "Este e-mail já está cadastrado." });

        var u = new Usuario
        {
            NumeroInscricao = InscricaoService.GerarNumeroInscricao(),
            Email = email,
            Nome = nome,
            SenhaHash = AuthService.HashSenha(req.Senha!),
            PrimeiroAcesso = false,
            UltimoAcesso = DateTime.UtcNow
        };
        db.Usuarios.Add(u);
        await db.SaveChangesAsync();

        var token = await auth.CriarTokenAsync(u.Id, u.NumeroInscricao);
        return Created("", new { success = true, token = token.TokenValue, usuario = UsuarioDto(u) });
    }

    // ── Login ────────────────────────────────────────────────
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        var id = (req.Identificador ?? req.Email ?? req.NumeroInscricao ?? "").Trim();
        if (string.IsNullOrWhiteSpace(id) || string.IsNullOrWhiteSpace(req.Senha))
            return BadRequest(new { success = false, message = "Informe e-mail e senha." });

        var email = id.ToLowerInvariant();
        var num   = id.ToUpperInvariant();
        var u = await db.Usuarios.FirstOrDefaultAsync(x => x.Email == email || x.NumeroInscricao == num);

        if (u == null || !u.Ativo || !AuthService.VerificarSenha(req.Senha, u.SenhaHash))
            return Unauthorized(new { success = false, message = "E-mail ou senha incorretos." });

        var token = await auth.CriarTokenAsync(u.Id, u.NumeroInscricao);
        u.UltimoAcesso = DateTime.UtcNow;
        await db.SaveChangesAsync();

        var insc = await db.Inscricoes.FirstOrDefaultAsync(i => i.NumeroInscricao == u.NumeroInscricao);
        var pag  = await db.Pagamentos.FirstOrDefaultAsync(p => p.NumeroInscricao == u.NumeroInscricao);

        return Ok(new
        {
            success = true,
            token = token.TokenValue,
            usuario = UsuarioDto(u),
            inscricao = insc == null ? null : new
            {
                insc.Curso, insc.Status,
                pagamento = pag == null ? null : new { pag.Status, pag.Valor, pag.Vencimento, pag.CodigoBarras, pag.LinhaDigitavel }
            }
        });
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var tokenVal = AuthService.ExtrairToken(Request.Headers.Authorization);
        if (!string.IsNullOrEmpty(tokenVal))
            await auth.RevogarTokenAsync(tokenVal);
        return Ok(new { success = true });
    }

    // ── Troca de senha (usuário logado) ──────────────────────
    [HttpPost("trocar-senha")]
    public async Task<IActionResult> TrocarSenha([FromBody] TrocarSenhaRequest req)
    {
        var u = await auth.ValidarTokenAsync(AuthService.ExtrairToken(Request.Headers.Authorization));
        if (u == null) return Unauthorized(new { success = false, message = "Faça login novamente." });

        if (string.IsNullOrWhiteSpace(req.SenhaNova) || req.SenhaNova.Length < 8)
            return BadRequest(new { success = false, message = "A nova senha precisa ter no mínimo 8 caracteres." });
        if (!AuthService.VerificarSenha(req.SenhaAtual ?? "", u.SenhaHash))
            return Unauthorized(new { success = false, message = "Senha atual incorreta." });

        u.SenhaHash = AuthService.HashSenha(req.SenhaNova);
        u.PrimeiroAcesso = false;
        await db.SaveChangesAsync();
        return Ok(new { success = true, message = "Senha alterada com sucesso." });
    }

    // ── Perfil do usuário logado ─────────────────────────────
    [HttpGet("perfil")]
    public async Task<IActionResult> Perfil()
    {
        var u = await auth.ValidarTokenAsync(AuthService.ExtrairToken(Request.Headers.Authorization));
        if (u == null) return Unauthorized(new { success = false, message = "Não autenticado." });

        var insc = await db.Inscricoes.FirstOrDefaultAsync(i => i.NumeroInscricao == u.NumeroInscricao);
        return Ok(new { success = true, usuario = UsuarioDto(u), inscricao = insc });
    }
}
