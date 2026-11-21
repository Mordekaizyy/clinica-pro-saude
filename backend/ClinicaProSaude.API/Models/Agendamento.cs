using System.ComponentModel.DataAnnotations;

namespace ClinicaProSaude.API.Models;

public class Agendamento
{
    public int Id { get; set; }

    [Required, MaxLength(150)]
    public string PacienteNome { get; set; } = string.Empty;

    public DateTime Inicio { get; set; }
    public DateTime Fim { get; set; }

    [MaxLength(30)]
    public string Status { get; set; } = "Agendado";

    public int ProfissionalId { get; set; }
    public Profissional? Profissional { get; set; }

    public int ProcedimentoId { get; set; }
    public Procedimento? Procedimento { get; set; }
}
