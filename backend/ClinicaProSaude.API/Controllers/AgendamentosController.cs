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
    public async Task<ActionResult> GetAll([FromQuery] DateOnly? data, [FromQuery] DateTime? inicio, [FromQuery] DateTime? fim, [FromQuery] int? profissionalId)
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

        if (inicio.HasValue) query = query.Where(x => x.Fim > inicio.Value);
        if (fim.HasValue) query = query.Where(x => x.Inicio < fim.Value);
        if (profissionalId.HasValue) query = query.Where(x => x.ProfissionalId == profissionalId.Value);

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

        var vinculado = await db.ProfissionalProcedimentos.AnyAsync(x =>
            x.ProfissionalId == dto.ProfissionalId && x.ProcedimentoId == dto.ProcedimentoId);
        if (!vinculado)
            return BadRequest("Este procedimento não é oferecido pelo profissional selecionado.");

        if (string.IsNullOrWhiteSpace(dto.PacienteTelefone))
            return BadRequest("Informe o telefone do paciente.");

        if (dto.Convenio && string.IsNullOrWhiteSpace(dto.NumeroCarteirinha))
            return BadRequest("Informe o número da carteirinha do convênio.");

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
            PacienteTelefone = dto.PacienteTelefone.Trim(),
            Convenio = dto.Convenio,
            NumeroCarteirinha = dto.Convenio ? dto.NumeroCarteirinha?.Trim() : null,
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
