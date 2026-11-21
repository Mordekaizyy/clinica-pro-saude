using System.ComponentModel.DataAnnotations;

namespace ClinicaProSaude.API.Models;

public class ModeloMensagem
{
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string Nome { get; set; } = string.Empty;

    [Required, MaxLength(2000)]
    public string Conteudo { get; set; } = string.Empty;

    [MaxLength(30)]
    public string Tipo { get; set; } = "Confirmacao";

    public bool Ativo { get; set; } = true;
}
