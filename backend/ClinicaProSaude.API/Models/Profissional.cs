using System.ComponentModel.DataAnnotations;

namespace ClinicaProSaude.API.Models;

public class Profissional
{
    public int Id { get; set; }

    [Required, MaxLength(150)]
    public string Nome { get; set; } = string.Empty;

    [MaxLength(100)]
    public string Especialidade { get; set; } = string.Empty;

    public bool Ativo { get; set; } = true;

    public ICollection<Agendamento> Agendamentos { get; set; } = new List<Agendamento>();
}
