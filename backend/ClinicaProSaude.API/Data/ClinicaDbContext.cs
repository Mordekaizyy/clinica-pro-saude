using ClinicaProSaude.API.Models;
using Microsoft.EntityFrameworkCore;

namespace ClinicaProSaude.API.Data;

public class ClinicaDbContext(DbContextOptions<ClinicaDbContext> options) : DbContext(options)
{
    public DbSet<Profissional> Profissionais => Set<Profissional>();
    public DbSet<Procedimento> Procedimentos => Set<Procedimento>();
    public DbSet<Agendamento> Agendamentos => Set<Agendamento>();
    public DbSet<ModeloMensagem> ModelosMensagem => Set<ModeloMensagem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Profissional>().HasIndex(x => x.Nome);
        modelBuilder.Entity<Procedimento>().HasIndex(x => x.Nome);

        modelBuilder.Entity<Agendamento>()
            .HasOne(x => x.Profissional)
            .WithMany(x => x.Agendamentos)
            .HasForeignKey(x => x.ProfissionalId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Agendamento>()
            .HasOne(x => x.Procedimento)
            .WithMany()
            .HasForeignKey(x => x.ProcedimentoId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Agendamento>()
            .Property(x => x.PacienteNome)
            .HasMaxLength(150);

        modelBuilder.Entity<Agendamento>(entity =>
            {
                entity.Property(a => a.Inicio)
                    .HasColumnType("timestamp without time zone");

                entity.Property(a => a.Fim)
                    .HasColumnType("timestamp without time zone");
            });

        base.OnModelCreating(modelBuilder);
    }
}
