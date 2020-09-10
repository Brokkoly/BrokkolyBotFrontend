using BrokkolyBotFrontend.GeneratedModels;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BrokkolyBotFrontend.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class RestrictedCommandsController : ControllerBase
    {
        private readonly DatabaseContext _context;

        public RestrictedCommandsController(DatabaseContext context)
        {
            _context = context;
        }

        // GET: api/RestrictedCommands
        [HttpGet]
        public async Task<ActionResult<IEnumerable<RestrictedCommand>>> GetRestrictedCommands()
        {
            return await _context.RestrictedCommands.ToListAsync();
        }

        // GET: api/RestrictedCommands/5
        [HttpGet("{id}")]
        public async Task<ActionResult<RestrictedCommand>> GetRestrictedCommand(int id)
        {
            var restrictedCommand = await _context.RestrictedCommands.FindAsync(id);

            if (restrictedCommand == null)
            {
                return NotFound();
            }

            return restrictedCommand;
        }

        /*
        // PUT: api/RestrictedCommands/5
        // To protect from overposting attacks, enable the specific properties you want to bind to, for
        // more details, see https://go.microsoft.com/fwlink/?linkid=2123754.
        [HttpPut("{id}")]
        public async Task<IActionResult> PutRestrictedCommand(int id, RestrictedCommand restrictedCommand)
        {
            if (id != restrictedCommand.Id)
            {
                return BadRequest();
            }

            _context.Entry(restrictedCommand).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!RestrictedCommandExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // POST: api/RestrictedCommands
        // To protect from overposting attacks, enable the specific properties you want to bind to, for
        // more details, see https://go.microsoft.com/fwlink/?linkid=2123754.
        [HttpPost]
        public async Task<ActionResult<RestrictedCommand>> PostRestrictedCommand(RestrictedCommand restrictedCommand)
        {
            _context.RestrictedCommands.Add(restrictedCommand);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetRestrictedCommand", new { id = restrictedCommand.Id }, restrictedCommand);
        }

        // DELETE: api/RestrictedCommands/5
        [HttpDelete("{id}")]
        public async Task<ActionResult<RestrictedCommand>> DeleteRestrictedCommand(int id)
        {
            var restrictedCommand = await _context.RestrictedCommands.FindAsync(id);
            if (restrictedCommand == null)
            {
                return NotFound();
            }

            _context.RestrictedCommands.Remove(restrictedCommand);
            await _context.SaveChangesAsync();

            return restrictedCommand;
        }

        private bool RestrictedCommandExists(int id)
        {
            return _context.RestrictedCommands.Any(e => e.Id == id);
        }
        */
    }
}
