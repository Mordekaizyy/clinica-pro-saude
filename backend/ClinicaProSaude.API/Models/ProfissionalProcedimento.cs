namespace ClinicaProSaude.API.Models;

public class ProfissionalProcedimento
{
    public int ProfissionalId { get; set; }
    public Profissional? Profissional { get; set; }

    public int ProcedimentoId { get; set; }
    public Procedimento? Procedimento { get; set; }
}
