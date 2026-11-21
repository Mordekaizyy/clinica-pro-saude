using ClinicaProSaude.API.Data;
using ClinicaProSaude.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ClinicaProSaude.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProcedimentosController(ClinicaDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Procedimento>>> GetAll() =>
        Ok(await db.Procedimentos.AsNoTracking().OrderBy(x => x.Nome).ToListAsync());

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Procedimento>> GetById(int id)
    {
        var item = await db.Procedimentos.FindAsync(id);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<Procedimento>> Create(Procedimento item)
    {
        item.Id = 0;
        db.Procedimentos.Add(item);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, Procedimento input)
    {
        var item = await db.Procedimentos.FindAsync(id);
        if (item is null) return NotFound();

        item.Nome = input.Nome;
        item.Descricao = input.Descricao;
        item.DuracaoMinutos = input.DuracaoMinutos;
        item.Ativo = input.Ativo;
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var item = await db.Procedimentos.FindAsync(id);
        if (item is null) return NotFound();
        if (await db.Agendamentos.AnyAsync(x => x.ProcedimentoId == id))
            return Conflict("Não é possível excluir um procedimento utilizado em agendamentos.");

        db.Procedimentos.Remove(item);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
