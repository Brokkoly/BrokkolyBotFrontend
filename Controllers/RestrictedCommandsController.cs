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
    }
}
