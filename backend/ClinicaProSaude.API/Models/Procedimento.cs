using System.ComponentModel.DataAnnotations;

namespace ClinicaProSaude.API.Models;

public class Procedimento
{
    public int Id { get; set; }

    [Required, MaxLength(150)]
    public string Nome { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Descricao { get; set; }

    [Range(5, 1440)]
    public int DuracaoMinutos { get; set; }

    public bool Ativo { get; set; } = true;
}
