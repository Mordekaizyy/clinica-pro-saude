using System.ComponentModel.DataAnnotations;

namespace ClinicaProSaude.API.DTOs;

public class AgendamentoCreateDto
{
    [Required, MaxLength(150)]
    public string PacienteNome { get; set; } = string.Empty;

    [Required, MaxLength(20)]
    public string PacienteTelefone { get; set; } = string.Empty;

    public bool Convenio { get; set; }

    [MaxLength(50)]
    public string? NumeroCarteirinha { get; set; }

    public DateTime Inicio { get; set; }
    public int ProfissionalId { get; set; }
    public int ProcedimentoId { get; set; }
}
