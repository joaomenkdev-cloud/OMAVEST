namespace Omavest.Models;

public record AtualizarProgressoRequest(int ConteudoId, int Percentual, bool Concluido);
public record GerarTrilhaRequest(string Vestibular, string[] DisciplinasDificuldade, int ItensPorDisciplina = 3);
public record GerarCronogramaRequest(string Vestibular, DateOnly DataProva, int MinutosPorDia, int[] DiasSemana, string[] DisciplinasDificuldade, int DiasParaGerar = 28);
public record PerguntaIaRequest(string Pergunta);
public record CorrecaoRedacaoRequest(string Tema, string Texto, string? Titulo);
public record CriarSimuladoRequest(string Vestibular, string[]? Materias, int Quantidade = 10);
public record RespostaSimuladoItem(int QuestaoId, string Resposta);
public record FinalizarSimuladoRequest(RespostaSimuladoItem[] Respostas);
public record PerfilRequest(string Nome, string? Email, string VestibularAlvo, DateOnly? DataVestibular, int MinutosPorDia, string DiasDisponiveis);
public record FavoritoRequest(int ConteudoId);
public record ImportarPdfRequest(string Url, string Titulo, string Fonte, string Tipo = "material");
