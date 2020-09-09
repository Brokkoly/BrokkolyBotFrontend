using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BrokkolyBotFrontend.GeneratedModels;

namespace BrokkolyBotFrontend.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class CommandsController : Controller
    {
        private readonly DatabaseContext _context;

        public CommandsController(DatabaseContext context)
        {
            _context = context;
        }

        // GET: api/Commands
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Command>>> GetCommandList()
        {
            return await _context.CommandList.ToListAsync();
        }

        // GET: api/Commands/GetCommandsForServer?serverId=5
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Command>>> GetCommandsForServer(string serverId)
        {
            return await _context.CommandList.Where(c=>c.ServerId==serverId).ToListAsync();
        }


        // GET: api/Commands/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Command>> GetCommand(int id)
        {
            var command = await _context.CommandList.FindAsync(id);

            if (command == null)
            {
                return NotFound();
            }

            return command;
        }

        // PUT: api/Commands/5
        // To protect from overposting attacks, enable the specific properties you want to bind to, for
        // more details, see https://go.microsoft.com/fwlink/?linkid=2123754.
        [HttpPut("{id}")]
        public async Task<IActionResult> PutCommand(int id, Command command)
        {
            if (id != command.Id || !CheckValidity(command))
            {
                return BadRequest();
            }

            _context.Entry(command).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!CommandExists(id))
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

        // POST: api/Commands
        // To protect from overposting attacks, enable the specific properties you want to bind to, for
        // more details, see https://go.microsoft.com/fwlink/?linkid=2123754.
        [HttpPost]
        public async Task<ActionResult<Command>> PostCommand(Command command)
        {
            if (!CheckValidity(command))
            {
                return BadRequest();
            }
            _context.CommandList.Add(command);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetCommand", new { id = command.Id }, command);
        }

        // DELETE: api/Commands/5
        [HttpDelete]
        public async Task<ActionResult<Command>> DeleteCommand(int id)
        {
            var command = await _context.CommandList.FindAsync(id);
            if (command == null)
            {
                return NotFound();
            }

            _context.CommandList.Remove(command);
            await _context.SaveChangesAsync();

            return command;
        }

        private bool CommandExists(int id)
        {
            return _context.CommandList.Any(e => e.Id == id);
        }

        private bool CheckValidity(Command command)
        {
            bool wasRestricted = _context.RestrictedCommands.Where(restrictedCommand => restrictedCommand.Command == command.CommandString).Any();
            if (wasRestricted)
            {
                //Todo: more verbose response types so that I can differentiate
                return false;
            }
            bool valueAlreadyThere = _context.CommandList.Where(
                cmd => cmd.ServerId == command.ServerId && cmd.CommandString == command.CommandString && cmd.EntryValue == command.EntryValue).Any();
            if (valueAlreadyThere)
            {
                //Todo: more verbose response types so that I can differentiate
                return false;
            }
            return true;
        }
    }
}
