using BrokkolyBotFrontend.GeneratedModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Caching.Memory;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Threading.Tasks.Dataflow;
using System.Windows.Input;

namespace BrokkolyBotFrontend.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class CommandsController : Controller
    {
        private readonly DatabaseContext _context;
        private readonly IMemoryCache _cache;

        public CommandsController(DatabaseContext context, IMemoryCache memoryCache)
        {
            _context = context;
            _cache = memoryCache;
        }

        // GET: api/Commands
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Command>>> GetCommandList()
        {
            return await _context.CommandList.AsQueryable().ToListAsync();
        }

        // GET: api/Commands/GetCommandsForServer?serverId=5
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Command>>> GetCommandsForServer(string serverId)
        {
            return await _context.CommandList.AsQueryable().Where(c => c.ServerId == serverId).ToListAsync();
        }

        [HttpGet]
        public ActionResult<List<ResponseGroup>> GetCommandGroupsForServer(string serverId)
        {
            var commandGroups = _context.CommandList.AsQueryable().Where(c => c.ServerId == serverId)
                .AsEnumerable()
                .GroupBy(command => command.CommandString);
            var commandGroupList = new List<ResponseGroup>(commandGroups.Count());
            int nextId = 0;
            foreach (IGrouping<string, Command> group in commandGroups)
            {
                var newGroup = new ResponseGroup()
                {
                    id = nextId++,
                    command = group.Key,
                    responses = new List<Response>()
                };

                foreach (Command command in group)
                {
                    newGroup.responses.Add(new Response()
                    {
                        id = command.Id,
                        response = command.EntryValue,
                        modOnly = command.ModOnly ?? 0,
                    });
                }
                commandGroupList.Add(newGroup);
            }
            return Ok(commandGroupList);
        }

        [HttpDelete]
        public async Task<ActionResult<Dictionary<int,bool>>> DeleteResponses(string token, [FromQuery(Name = "ids")] int[] ids)
        {
            var results = new Dictionary<int, bool>();
            foreach (int id in ids)
            {
                results.Add(id,await DeleteCommand(id, token, false));
            }
            await _context.SaveChangesAsync();
            return Ok(results);
        }

        public async Task<ActionResult> PostResponses(string token, [FromBody] JObject data)
        {
            List<Command> commands = data["commands"].ToObject<List<Command>>();
            foreach (Command command in commands)
            {
                await EditCommand(command, token, true);
            }
            return Ok();
        }


        [HttpPut]
        public async Task<ActionResult<Dictionary<int, int>>> PutResponses(string token, [FromBody] JObject data)
        {
            List<Command> commands = data["commands"].ToObject<List<Command>>();
            var results = new List<ActionResult<Command>>(commands.Count);
            var commandMap = new Dictionary<int, int>();

            foreach (Command command in commands)
            {
                if (!UserCanEditCommand(command, token))
                {
                    results.Add(Forbid());
                    continue;
                }
                if (!CheckValidity(command))
                {
                    results.Add(BadRequest());
                    continue;
                }
                var oldId = command.Id;
                var commandWithNoId = new Command()
                {
                    ServerId = command.ServerId,
                    CommandString = command.CommandString,
                    EntryValue = command.EntryValue,
                    ModOnly = command.ModOnly
                };
                _context.CommandList.Add(commandWithNoId);
                await _context.SaveChangesAsync();
                var newId = commandWithNoId.Id;
                commandMap.Add(oldId, newId);
                results.Add(CreatedAtAction("GetCommand", new { id = commandWithNoId.Id }, commandWithNoId));
            }



            return Ok(commandMap);
        }

        //[HttpPost]
        //public async Task<List<ActionResult<Command>>> PostResponses(string token, [FromBody] JObject data)
        //{
        //    List<Command> commands = data["commands"].ToObject<List<Command>>();
        //}

        private async Task<bool> EditCommand(Command command, string token, bool save = true)
        {
            if (!UserCanEditCommand(command, token))
            {
                //return Forbid();
                return false;
            }
            if (!CheckValidity(command))
            {
                //return BadRequest();
                return false;
            }
            _context.Entry(command).State = EntityState.Modified;

            if (save)
            {
                try
                {
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!CommandExists(command.Id))
                    {
                        //return NotFound();
                        return false;
                    }
                    else
                    {
                        throw;
                    }
                }
            }
            //return NoContent();
            return true;
        }

        //[HttpPost]
        //public async Task<ActionResult<List<int>>> SaveCommandGroupForServer(string serverId, string accessToken, [FromBody] JObject data)
        //{
        //    ResponseGroup responseGroup = data["responseGroup"].ToObject<ResponseGroup>();
        //    bool updateCommands = false;
        //    var results = new List<ActionResult<Command>>(responseGroup.responses.Count);
        //    if (responseGroup?.commandUpdated ?? false)
        //    {
        //        //Have to edit all of the commands;
        //        updateCommands = true;
        //    }
        //    responseGroup.responses.ForEach(async (resp) =>
        //    {
        //        ActionResult<Command> actionResult;
        //        if (resp.deleted)
        //        {
        //            actionResult = await DeleteCommand(resp.id, accessToken, false);
        //        }
        //        else
        //        {
        //            Command cmd = new Command()
        //            {
        //                Id = resp.id,
        //                ServerId = serverId,
        //                CommandString = responseGroup.command,
        //                ModOnly = resp.modOnly,
        //                EntryValue = resp.response
        //            };
        //            if (cmd.Id < 0)
        //            {
        //                actionResult = await AddCommand(cmd, accessToken, false);
        //            }
        //            else
        //            {
        //                actionResult = await EditCommand(cmd, accessToken, false);
        //            }
        //        }
        //        results.Add(actionResult);
        //    });

        //    bool successful = true;
        //    foreach (ActionResult<Command> result in results)
        //    {
        //        if (result.Result.)
        //            if (actionResult.)
        //    }
        //}


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

        //// DELETE: api/Commands/5
        //[HttpDelete]
        //public async Task<ActionResult<Command>> DeleteCommand([FromBody] JObject data)
        //{
        //    string token = data["token"].ToObject<string>();
        //    int id = data["id"].ToObject<int>();
        //    if (!UserCanEditCommand(id, token))
        //    {
        //        return Forbid();
        //    }
        //    var commandConfirm = await _context.CommandList.FindAsync(id);
        //    if (commandConfirm == null)
        //    {
        //        return NotFound();
        //    }

        //    _context.CommandList.Remove(commandConfirm);
        //    await _context.SaveChangesAsync();

        //    return commandConfirm;
        //}

        private async Task<bool> DeleteCommand(int id, string token, bool save = true)
        {
            if (!UserCanEditCommand(id, token))
            {
                return false;
            }
            var commandConfirm = await _context.CommandList.FindAsync(id);
            if (commandConfirm == null)
            {
                return false;
            }
            _context.CommandList.Remove(commandConfirm);
            if (save)
            {
                await _context.SaveChangesAsync();
            }
            return true;
        }


        private async Task<ActionResult<Command>> AddCommand(Command command, string token, bool save = true)
        {
            if (!UserCanEditCommand(command, token))
            {
                return Forbid();
            }
            if (!CheckValidity(command))
            {
                return BadRequest();
            }
            _context.CommandList.Add(command);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetCommand", new { id = command.Id }, command);
        }

        private bool CommandExists(int id)
        {
            return _context.CommandList.AsQueryable().Any(e => e.Id == id);
        }

        private bool CheckValidity(Command command)
        {
            bool wasRestricted = _context.RestrictedCommands.AsQueryable().Where(restrictedCommand => restrictedCommand.Command == command.CommandString).Any();
            if (wasRestricted)
            {
                //Todo: more verbose response types so that I can differentiate
                return false;
            }
            bool valueAlreadyThere = _context.CommandList.AsQueryable().Where(
                cmd =>
                    cmd.ServerId == command.ServerId && cmd.CommandString == command.CommandString && cmd.EntryValue == command.EntryValue && cmd.ModOnly == command.ModOnly).Any();
            if (valueAlreadyThere)
            {
                //Todo: more verbose response types so that I can differentiate
                return false;
            }
            bool serverIdWasNotValid = _context.CommandList.AsQueryable().Where(cmd => (cmd.Id == command.Id) && (cmd.ServerId != command.ServerId)).Any();
            if (serverIdWasNotValid)
            {
                return false;
            }
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
            if (!_cache.TryGetValue(CacheKeys.CanEditGuild + token + serverId, out bool cacheResult))
            {
                cacheResult = DiscordController.UserHasServerPermissions(serverId, token);
                var cacheEntryOptions = new MemoryCacheEntryOptions().SetSlidingExpiration(System.TimeSpan.FromSeconds(60));
                _cache.Set(CacheKeys.CanEditGuild + token + serverId, cacheResult, cacheEntryOptions);
            }
            return cacheResult;
        }
    }
}

public class CommandGroupToDelete
{
    public string command { get; set; }
    public List<Command> commands { get; set; }
}

public class ResponseGroup
{
    public int id { get; set; }
    public string command { get; set; }
    public bool? deleted { get; set; }
    public bool? commandUpdated { get; set; }
    public List<Response> responses { get; set; }
}

public class Response
{
    public int id { get; set; }
    public string response { get; set; }
    public int modOnly { get; set; }
    public bool deleted { get; set; }
}