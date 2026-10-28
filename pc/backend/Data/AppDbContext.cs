using Microsoft.EntityFrameworkCore;
using Omavest.Models;

namespace Omavest.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<UsuarioPerfil> Usuarios => Set<UsuarioPerfil>();
    public DbSet<Disciplina> Disciplinas => Set<Disciplina>();
    public DbSet<Tema> Temas => Set<Tema>();
    public DbSet<Conteudo> Conteudos => Set<Conteudo>();
    public DbSet<ProgressoConteudo> Progressos => Set<ProgressoConteudo>();
    public DbSet<Trilha> Trilhas => Set<Trilha>();
    public DbSet<TrilhaConteudo> TrilhasConteudos => Set<TrilhaConteudo>();
    public DbSet<CronogramaEstudo> Cronogramas => Set<CronogramaEstudo>();
    public DbSet<CalendarioVestibular> CalendarioVestibulares => Set<CalendarioVestibular>();
    public DbSet<Prova> Provas => Set<Prova>();
    public DbSet<Questao> Questoes => Set<Questao>();
    public DbSet<SimuladoTentativa> Simulados => Set<SimuladoTentativa>();
    public DbSet<SimuladoResposta> SimuladoRespostas => Set<SimuladoResposta>();
    public DbSet<Redacao> Redacoes => Set<Redacao>();
    public DbSet<Favorito> Favoritos => Set<Favorito>();
    public DbSet<RagDocumento> RagDocumentos => Set<RagDocumento>();
    public DbSet<RagTrecho> RagTrechos => Set<RagTrecho>();
    public DbSet<Universidade> Universidades => Set<Universidade>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UsuarioPerfil>().HasIndex(x => x.FirebaseUid).IsUnique();
        modelBuilder.Entity<Disciplina>().HasIndex(x => x.Slug).IsUnique();
        modelBuilder.Entity<Tema>().HasIndex(x => new { x.DisciplinaId, x.Slug }).IsUnique();
        modelBuilder.Entity<ProgressoConteudo>().HasIndex(x => new { x.FirebaseUid, x.ConteudoId }).IsUnique();
        modelBuilder.Entity<Favorito>().HasIndex(x => new { x.FirebaseUid, x.ConteudoId }).IsUnique();
        modelBuilder.Entity<TrilhaConteudo>().HasIndex(x => new { x.TrilhaId, x.ConteudoId }).IsUnique();

        modelBuilder.Entity<Tema>()
            .HasOne(x => x.Disciplina).WithMany(x => x.Temas)
            .HasForeignKey(x => x.DisciplinaId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<Conteudo>()
            .HasOne(x => x.Tema).WithMany(x => x.Conteudos)
            .HasForeignKey(x => x.TemaId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<TrilhaConteudo>()
            .HasOne(x => x.Trilha).WithMany(x => x.Itens)
            .HasForeignKey(x => x.TrilhaId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<SimuladoResposta>()
            .HasOne(x => x.Tentativa).WithMany(x => x.Respostas)
            .HasForeignKey(x => x.SimuladoTentativaId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<RagTrecho>()
            .HasOne(x => x.Documento).WithMany(x => x.Trechos)
            .HasForeignKey(x => x.RagDocumentoId).OnDelete(DeleteBehavior.Cascade);
    }
}
