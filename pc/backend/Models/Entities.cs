using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Omavest.Models;

public class UsuarioPerfil
{
    [Key] public int Id { get; set; }
    [Required, MaxLength(128)] public string FirebaseUid { get; set; } = "";
    [MaxLength(160)] public string Nome { get; set; } = "Estudante";
    [MaxLength(160)] public string? Email { get; set; }
    [MaxLength(80)] public string VestibularAlvo { get; set; } = "ENEM";
    public DateOnly? DataVestibular { get; set; }
    public int MinutosPorDia { get; set; } = 120;
    [MaxLength(60)] public string DiasDisponiveis { get; set; } = "1,2,3,4,5";
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
    public DateTime AtualizadoEm { get; set; } = DateTime.UtcNow;
}

public class Disciplina
{
    [Key] public int Id { get; set; }
    [Required, MaxLength(100)] public string Nome { get; set; } = "";
    [Required, MaxLength(100)] public string Slug { get; set; } = "";
    [MaxLength(40)] public string Icone { get; set; } = "book-open";
    [MaxLength(20)] public string Cor { get; set; } = "verde";
    [MaxLength(400)] public string? Descricao { get; set; }
    public int Ordem { get; set; }
    public bool Ativa { get; set; } = true;
    public ICollection<Tema> Temas { get; set; } = new List<Tema>();
}

public class Tema
{
    [Key] public int Id { get; set; }
    public int DisciplinaId { get; set; }
    [Required, MaxLength(140)] public string Nome { get; set; } = "";
    [Required, MaxLength(160)] public string Slug { get; set; } = "";
    [MaxLength(400)] public string? Descricao { get; set; }
    public int Ordem { get; set; }
    public bool Ativo { get; set; } = true;
    [ForeignKey(nameof(DisciplinaId))] public Disciplina? Disciplina { get; set; }
    public ICollection<Conteudo> Conteudos { get; set; } = new List<Conteudo>();
}

public class Conteudo
{
    [Key] public int Id { get; set; }
    public int TemaId { get; set; }
    [Required, MaxLength(220)] public string Titulo { get; set; } = "";
    [MaxLength(700)] public string? Descricao { get; set; }
    [MaxLength(40)] public string Tipo { get; set; } = "material";
    [MaxLength(40)] public string Dificuldade { get; set; } = "media";
    [MaxLength(280)] public string? Url { get; set; }
    [MaxLength(180)] public string Fonte { get; set; } = "OMAVEST";
    public int DuracaoMinutos { get; set; } = 25;
    public string TextoBase { get; set; } = "";
    public bool Gratuito { get; set; } = true;
    public bool Ativo { get; set; } = true;
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
    [ForeignKey(nameof(TemaId))] public Tema? Tema { get; set; }
}

public class ProgressoConteudo
{
    [Key] public int Id { get; set; }
    [Required, MaxLength(128)] public string FirebaseUid { get; set; } = "";
    public int ConteudoId { get; set; }
    public int Percentual { get; set; }
    public bool Concluido { get; set; }
    public DateTime AtualizadoEm { get; set; } = DateTime.UtcNow;
    [ForeignKey(nameof(ConteudoId))] public Conteudo? Conteudo { get; set; }
}

public class Trilha
{
    [Key] public int Id { get; set; }
    [Required, MaxLength(128)] public string FirebaseUid { get; set; } = "";
    [MaxLength(180)] public string Nome { get; set; } = "Minha trilha";
    [MaxLength(80)] public string Vestibular { get; set; } = "ENEM";
    [MaxLength(500)] public string? Descricao { get; set; }
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
    public ICollection<TrilhaConteudo> Itens { get; set; } = new List<TrilhaConteudo>();
}

public class TrilhaConteudo
{
    [Key] public int Id { get; set; }
    public int TrilhaId { get; set; }
    public int ConteudoId { get; set; }
    public int Ordem { get; set; }
    public bool Obrigatorio { get; set; } = true;
    [ForeignKey(nameof(TrilhaId))] public Trilha? Trilha { get; set; }
    [ForeignKey(nameof(ConteudoId))] public Conteudo? Conteudo { get; set; }
}

public class CronogramaEstudo
{
    [Key] public int Id { get; set; }
    [Required, MaxLength(128)] public string FirebaseUid { get; set; } = "";
    public DateOnly Data { get; set; }
    public int DisciplinaId { get; set; }
    public int? TemaId { get; set; }
    public int? ConteudoId { get; set; }
    [MaxLength(180)] public string Titulo { get; set; } = "Sessão de estudo";
    public int MinutosPlanejados { get; set; } = 60;
    public bool Concluido { get; set; }
    public int Percentual { get; set; }
    public bool GeradoAutomaticamente { get; set; } = true;
    [ForeignKey(nameof(DisciplinaId))] public Disciplina? Disciplina { get; set; }
    [ForeignKey(nameof(TemaId))] public Tema? Tema { get; set; }
    [ForeignKey(nameof(ConteudoId))] public Conteudo? Conteudo { get; set; }
}

public class CalendarioVestibular
{
    [Key] public int Id { get; set; }
    [Required, MaxLength(100)] public string Instituicao { get; set; } = "";
    [Required, MaxLength(180)] public string Evento { get; set; } = "";
    public DateOnly DataInicio { get; set; }
    public DateOnly? DataFim { get; set; }
    [MaxLength(40)] public string Tipo { get; set; } = "prova";
    [MaxLength(280)] public string? UrlOficial { get; set; }
    public bool Ativo { get; set; } = true;
}

public class Prova
{
    [Key] public int Id { get; set; }
    [Required, MaxLength(220)] public string Titulo { get; set; } = "";
    public int Ano { get; set; }
    [Required, MaxLength(100)] public string Instituicao { get; set; } = "";
    [MaxLength(100)] public string Area { get; set; } = "geral";
    public int QuantidadeQuestoes { get; set; }
    public int DuracaoMinutos { get; set; } = 240;
    [MaxLength(280)] public string? ProvaUrl { get; set; }
    [MaxLength(280)] public string? GabaritoUrl { get; set; }
    [MaxLength(180)] public string? Fonte { get; set; }
    public bool Ativo { get; set; } = true;
    public ICollection<Questao> Questoes { get; set; } = new List<Questao>();
}

public class Questao
{
    [Key] public int Id { get; set; }
    public int? ProvaId { get; set; }
    [Required, MaxLength(100)] public string Materia { get; set; } = "Geral";
    [MaxLength(140)] public string? Tema { get; set; }
    public int Ano { get; set; }
    [MaxLength(30)] public string Dificuldade { get; set; } = "media";
    [Required] public string Enunciado { get; set; } = "";
    public string AlternativaA { get; set; } = "";
    public string AlternativaB { get; set; } = "";
    public string AlternativaC { get; set; } = "";
    public string AlternativaD { get; set; } = "";
    public string AlternativaE { get; set; } = "";
    [MaxLength(1)] public string RespostaCorreta { get; set; } = "A";
    public string? Explicacao { get; set; }
    [MaxLength(180)] public string Fonte { get; set; } = "OMAVEST";
    public bool Ativo { get; set; } = true;
    [ForeignKey(nameof(ProvaId))] public Prova? Prova { get; set; }
}

public class SimuladoTentativa
{
    [Key] public int Id { get; set; }
    [Required, MaxLength(128)] public string FirebaseUid { get; set; } = "";
    [MaxLength(100)] public string Vestibular { get; set; } = "Geral";
    public DateTime IniciadoEm { get; set; } = DateTime.UtcNow;
    public DateTime? FinalizadoEm { get; set; }
    public int TotalQuestoes { get; set; }
    public int Acertos { get; set; }
    public ICollection<SimuladoResposta> Respostas { get; set; } = new List<SimuladoResposta>();
}

public class SimuladoResposta
{
    [Key] public int Id { get; set; }
    public int SimuladoTentativaId { get; set; }
    public int QuestaoId { get; set; }
    [MaxLength(1)] public string Resposta { get; set; } = "";
    public bool Correta { get; set; }
    [ForeignKey(nameof(SimuladoTentativaId))] public SimuladoTentativa? Tentativa { get; set; }
    [ForeignKey(nameof(QuestaoId))] public Questao? Questao { get; set; }
}

public class Redacao
{
    [Key] public int Id { get; set; }
    [Required, MaxLength(128)] public string FirebaseUid { get; set; } = "";
    [MaxLength(220)] public string Tema { get; set; } = "";
    [MaxLength(220)] public string? Titulo { get; set; }
    public string Texto { get; set; } = "";
    public string? Feedback { get; set; }
    public int? NotaEstimada { get; set; }
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
}

public class Favorito
{
    [Key] public int Id { get; set; }
    [Required, MaxLength(128)] public string FirebaseUid { get; set; } = "";
    public int ConteudoId { get; set; }
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
    [ForeignKey(nameof(ConteudoId))] public Conteudo? Conteudo { get; set; }
}

public class RagDocumento
{
    [Key] public int Id { get; set; }
    [Required, MaxLength(220)] public string Titulo { get; set; } = "";
    [MaxLength(180)] public string Fonte { get; set; } = "OMAVEST";
    [MaxLength(280)] public string? Url { get; set; }
    [MaxLength(50)] public string Tipo { get; set; } = "conteudo";
    public bool Ativo { get; set; } = true;
    public ICollection<RagTrecho> Trechos { get; set; } = new List<RagTrecho>();
}

public class RagTrecho
{
    [Key] public int Id { get; set; }
    public int RagDocumentoId { get; set; }
    public int? ConteudoId { get; set; }
    public int Ordem { get; set; }
    public string Texto { get; set; } = "";
    public string EmbeddingJson { get; set; } = "[]";
    [ForeignKey(nameof(RagDocumentoId))] public RagDocumento? Documento { get; set; }
    [ForeignKey(nameof(ConteudoId))] public Conteudo? Conteudo { get; set; }
}

public class Universidade
{
    [Key] public int Id { get; set; }
    [Required, MaxLength(140)] public string Nome { get; set; } = "";
    [MaxLength(80)] public string Sigla { get; set; } = "";
    [MaxLength(140)] public string Vestibular { get; set; } = "";
    [MaxLength(180)] public string Localizacao { get; set; } = "";
    [MaxLength(280)] public string? SiteOficial { get; set; }
    [MaxLength(500)] public string? Descricao { get; set; }
    public bool Ativa { get; set; } = true;
}
