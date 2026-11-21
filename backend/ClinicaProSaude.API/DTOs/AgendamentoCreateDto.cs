using System.ComponentModel.DataAnnotations;

namespace ClinicaProSaude.API.DTOs;

public class AgendamentoCreateDto
{
    [Required, MaxLength(150)]
    public string PacienteNome { get; set; } = string.Empty;

    public DateTime Inicio { get; set; }
    public int ProfissionalId { get; set; }
    public int ProcedimentoId { get; set; }
}
