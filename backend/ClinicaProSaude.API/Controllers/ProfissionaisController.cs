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
}
