using ClinicaProSaude.API.Data;
using ClinicaProSaude.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ClinicaProSaude.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MensagensController(ClinicaDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ModeloMensagem>>> GetAll() =>
        Ok(await db.ModelosMensagem.AsNoTracking().OrderBy(x => x.Nome).ToListAsync());

    [HttpPost]
    public async Task<ActionResult<ModeloMensagem>> Create(ModeloMensagem item)
    {
        item.Id = 0;
        db.ModelosMensagem.Add(item);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new { id = item.Id }, item);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, ModeloMensagem input)
    {
        var item = await db.ModelosMensagem.FindAsync(id);
        if (item is null) return NotFound();

        item.Nome = input.Nome;
        item.Conteudo = input.Conteudo;
        item.Tipo = input.Tipo;
        item.Ativo = input.Ativo;
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var item = await db.ModelosMensagem.FindAsync(id);
        if (item is null) return NotFound();
        db.ModelosMensagem.Remove(item);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
