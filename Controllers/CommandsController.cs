using BrokkolyBotFrontend.GeneratedModels;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BrokkolyBotFrontend.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class CommandsController : Controller
    {
        private readonly DatabaseContext _context;
        private IMemoryCache _cache;

        public CommandsController(DatabaseContext context, IMemoryCache memoryCache)
        {
            _context = context;
            _cache = memoryCache;
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
            return await _context.CommandList.Where(c => c.ServerId == serverId).ToListAsync();
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
        [HttpPut]
        public async Task<IActionResult> PutCommand([FromBody] JObject data)
        {
            Command command = data["command"].ToObject<Command>();
            string token = data["token"].ToObject<string>();

            if (!CheckValidity(command))
            {
                return BadRequest();
            }
            if (!UserCanEditCommand(command, token))
            {
                return Forbid();
            }

            _context.Entry(command).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!CommandExists(command.Id))
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
        public async Task<ActionResult<Command>> PostCommand([FromBody] JObject data)
        {
            Command command = data["command"].ToObject<Command>();
            string token = data["token"].ToObject<string>();

            if (!UserCanEditCommand(command, token))
            {
                return BadRequest();
            }
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
        public async Task<ActionResult<Command>> DeleteCommand([FromBody] JObject data)
        {
            Command command = data["command"].ToObject<Command>();
            string token = data["token"].ToObject<string>();
            if (!UserCanEditCommand(command.Id, token))
            {
                return BadRequest();
            }
            var commandConfirm = await _context.CommandList.FindAsync(command.Id);
            if (commandConfirm == null)
            {
                return NotFound();
            }

            _context.CommandList.Remove(commandConfirm);
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
            bool serverIdWasNotValid = _context.CommandList.Where(cmd => (cmd.Id == command.Id) && (cmd.ServerId != command.ServerId)).Any();
            if (serverIdWasNotValid)
            {
                return false;
            }
            //TODO check that server is correct.
            return true;
        }

        private bool UserCanEditCommand(int commandId, string accessToken)
        {
            Command command = _context.CommandList.Find(commandId);
            if (command == null)
            {
                return false;
            }
            else
            {
                return UserCanEditCommand(command, accessToken);
            }
        }
        private bool UserCanEditCommand(Command command, string accessToken)
        {
            return TryGetUserHasServerPermissions(command.ServerId, accessToken);
        }

        public bool TryGetUserHasServerPermissions(string serverId, string token)
        {
            bool cacheResult;
            if (!_cache.TryGetValue(CacheKeys.CanEditGuild + token + serverId, out cacheResult))
            {
                cacheResult = DiscordController.UserHasServerPermissions(serverId, token);
                var cacheEntryOptions = new MemoryCacheEntryOptions().SetSlidingExpiration(System.TimeSpan.FromSeconds(60));
                _cache.Set(CacheKeys.CanEditGuild + token + serverId, cacheResult, cacheEntryOptions);
            }
            return cacheResult;
        }
    }
}
