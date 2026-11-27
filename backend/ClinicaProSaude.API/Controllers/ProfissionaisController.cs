using ClinicaProSaude.API.Data;
using ClinicaProSaude.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ClinicaProSaude.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProfissionaisController(ClinicaDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Profissional>>> GetAll() =>
        Ok(await db.Profissionais.AsNoTracking().OrderBy(x => x.Nome).ToListAsync());

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Profissional>> GetById(int id)
    {
        var item = await db.Profissionais.FindAsync(id);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<Profissional>> Create(Profissional item)
    {
        item.Id = 0;
        db.Profissionais.Add(item);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, Profissional input)
    {
        var item = await db.Profissionais.FindAsync(id);
        if (item is null) return NotFound();

        item.Nome = input.Nome;
        item.Especialidade = input.Especialidade;
        item.Ativo = input.Ativo;
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var item = await db.Profissionais.FindAsync(id);
        if (item is null) return NotFound();
        if (await db.Agendamentos.AnyAsync(x => x.ProfissionalId == id))
            return Conflict("Não é possível excluir um profissional que possui agendamentos.");

        db.Profissionais.Remove(item);
        await db.SaveChangesAsync();
        return NoContent();
    }

    // Lista todos os vínculos profissional ↔ procedimento.
    [HttpGet("vinculos")]
    public async Task<ActionResult> GetVinculos() =>
        Ok(await db.ProfissionalProcedimentos.AsNoTracking()
            .Select(x => new { x.ProfissionalId, x.ProcedimentoId })
            .ToListAsync());

    [HttpGet("{id:int}/procedimentos")]
    public async Task<ActionResult<IEnumerable<Procedimento>>> GetProcedimentos(int id)
    {
        if (!await db.Profissionais.AnyAsync(x => x.Id == id)) return NotFound();
        var items = await db.ProfissionalProcedimentos.AsNoTracking()
            .Where(x => x.ProfissionalId == id)
            .Select(x => x.Procedimento!)
            .OrderBy(x => x.Nome)
            .ToListAsync();
        return Ok(items);
    }

    // Substitui todos os procedimentos vinculados ao profissional.
    [HttpPut("{id:int}/procedimentos")]
    public async Task<IActionResult> SetProcedimentos(int id, [FromBody] int[] procedimentoIds)
    {
        if (!await db.Profissionais.AnyAsync(x => x.Id == id)) return NotFound();

        var ids = procedimentoIds.Distinct().ToList();
        var existentes = await db.Procedimentos.Where(x => ids.Contains(x.Id)).Select(x => x.Id).ToListAsync();
        if (existentes.Count != ids.Count)
            return BadRequest("Um ou mais procedimentos não foram encontrados.");

        var atuais = await db.ProfissionalProcedimentos.Where(x => x.ProfissionalId == id).ToListAsync();
        db.ProfissionalProcedimentos.RemoveRange(atuais);
        db.ProfissionalProcedimentos.AddRange(ids.Select(pid => new ProfissionalProcedimento { ProfissionalId = id, ProcedimentoId = pid }));
        await db.SaveChangesAsync();
        return NoContent();
    }
}
