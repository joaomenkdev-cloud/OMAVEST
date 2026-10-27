using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Omavest.Data;
using Omavest.Models;

namespace Omavest.Services;

public class AuthService(AppDbContext db)
{
    private const int Iteracoes = 100_000;

    /// <summary>Gera o hash da senha com PBKDF2 + sal aleatório (formato: pbkdf2$iter$sal$hash).</summary>
    public static string HashSenha(string senha)
    {
        var sal  = RandomNumberGenerator.GetBytes(16);
        var hash = Rfc2898DeriveBytes.Pbkdf2(senha, sal, Iteracoes, HashAlgorithmName.SHA256, 32);
        return $"pbkdf2${Iteracoes}${Convert.ToBase64String(sal)}${Convert.ToBase64String(hash)}";
    }

    /// <summary>Confere a senha. Aceita também hashes SHA-256 antigos (bancos criados em versões anteriores).</summary>
    public static bool VerificarSenha(string senha, string hashSalvo)
    {
        if (string.IsNullOrEmpty(hashSalvo)) return false;

        if (hashSalvo.StartsWith("pbkdf2$"))
        {
            var partes = hashSalvo.Split('$');
            if (partes.Length != 4 || !int.TryParse(partes[1], out var iter)) return false;
            var sal      = Convert.FromBase64String(partes[2]);
            var esperado = Convert.FromBase64String(partes[3]);
            var atual    = Rfc2898DeriveBytes.Pbkdf2(senha, sal, iter, HashAlgorithmName.SHA256, esperado.Length);
            return CryptographicOperations.FixedTimeEquals(atual, esperado);
        }

        // Legado: SHA-256 em hexadecimal
        var legado = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(senha))).ToLower();
        return legado == hashSalvo;
    }

    public static string GerarToken() =>
        Convert.ToBase64String(RandomNumberGenerator.GetBytes(30))
               .Replace("+", "-").Replace("/", "_").Replace("=", "");

    /// <summary>Extrai o token do cabeçalho "Authorization: Bearer ...".</summary>
    public static string ExtrairToken(string? cabecalho) =>
        (cabecalho ?? "").Replace("Bearer ", "", StringComparison.OrdinalIgnoreCase).Trim();

    public async Task<Usuario?> ValidarTokenAsync(string token)
    {
        if (string.IsNullOrWhiteSpace(token)) return null;

        var t = await db.Tokens
            .Include(x => x.Usuario)
            .FirstOrDefaultAsync(x => x.TokenValue == token && x.Ativo);

        if (t == null) return null;
        if (t.ExpiraEm != null && t.ExpiraEm < DateTime.UtcNow) return null;
        return t.Usuario?.Ativo == true ? t.Usuario : null;
    }

    public async Task<Token> CriarTokenAsync(int usuarioId, string numeroInscricao)
    {
        var token = new Token
        {
            TokenValue = GerarToken(),
            UsuarioId = usuarioId,
            NumeroInscricao = numeroInscricao,
            ExpiraEm = DateTime.UtcNow.AddDays(7)
        };
        db.Tokens.Add(token);
        await db.SaveChangesAsync();
        return token;
    }

    public async Task RevogarTokenAsync(string tokenValue)
    {
        var token = await db.Tokens.FirstOrDefaultAsync(t => t.TokenValue == tokenValue);
        if (token != null) { token.Ativo = false; await db.SaveChangesAsync(); }
    }
}
