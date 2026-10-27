namespace Omavest.Services;

public static class InscricaoService
{
    public static string GerarNumeroInscricao()
    {
        var hex = Convert.ToHexString(Guid.NewGuid().ToByteArray()[..3]).ToUpper();
        return $"OM{DateTime.UtcNow:yyMMdd}{hex}";
    }

    public static string CalcStatus(DateOnly inicio, DateOnly fim)
    {
        var hoje = DateOnly.FromDateTime(DateTime.UtcNow);
        if (hoje > fim)    return "concluido";
        if (hoje >= inicio) return "em_andamento";
        return "futuro";
    }
}