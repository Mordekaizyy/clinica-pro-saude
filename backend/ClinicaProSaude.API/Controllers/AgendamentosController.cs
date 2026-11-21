using ClinicaProSaude.API.Data;
using ClinicaProSaude.API.DTOs;
using ClinicaProSaude.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ClinicaProSaude.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AgendamentosController(ClinicaDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult> GetAll([FromQuery] DateOnly? data)
    {
        var query = db.Agendamentos
            .AsNoTracking()
            .Include(x => x.Profissional)
            .Include(x => x.Procedimento)
            .AsQueryable();

        if (data.HasValue)
        {
            var inicioDia = data.Value.ToDateTime(TimeOnly.MinValue);
            var fimDia = inicioDia.AddDays(1);
            query = query.Where(x => x.Inicio >= inicioDia && x.Inicio < fimDia);
        }

        var items = await query.OrderBy(x => x.Inicio).ToListAsync();
        return Ok(items);
    }

    [HttpPost]
    public async Task<ActionResult> Create(AgendamentoCreateDto dto)
    {
        if (dto.Inicio == default)
            return BadRequest("Informe a data e o horário de início.");

        var profissional = await db.Profissionais
            .FirstOrDefaultAsync(x => x.Id == dto.ProfissionalId && x.Ativo);
        if (profissional is null)
            return BadRequest("Profissional não encontrado ou inativo.");

        var procedimento = await db.Procedimentos
            .FirstOrDefaultAsync(x => x.Id == dto.ProcedimentoId && x.Ativo);
        if (procedimento is null)
            return BadRequest("Procedimento não encontrado ou inativo.");

        var fim = dto.Inicio.AddMinutes(procedimento.DuracaoMinutos);

        var conflito = await db.Agendamentos.AnyAsync(x =>
            x.ProfissionalId == dto.ProfissionalId &&
            x.Status != "Cancelado" &&
            x.Inicio < fim &&
            x.Fim > dto.Inicio);

        if (conflito)
            return Conflict("Já existe um agendamento para esse profissional nesse intervalo.");

        var item = new Agendamento
        {
            PacienteNome = dto.PacienteNome.Trim(),
            Inicio = dto.Inicio,
            Fim = fim,
            ProfissionalId = dto.ProfissionalId,
            ProcedimentoId = dto.ProcedimentoId
        };

        db.Agendamentos.Add(item);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAll), new { }, new
        {
            item.Id,
            item.PacienteNome,
            item.Inicio,
            item.Fim,
            item.Status,
            item.ProfissionalId,
            item.ProcedimentoId
        });
    }

    [HttpPatch("{id:int}/cancelar")]
    public async Task<IActionResult> Cancelar(int id)
    {
        var item = await db.Agendamentos.FindAsync(id);
        if (item is null) return NotFound();
        if (item.Status == "Cancelado") return NoContent();

        item.Status = "Cancelado";
        await db.SaveChangesAsync();
        return NoContent();
    }
}
