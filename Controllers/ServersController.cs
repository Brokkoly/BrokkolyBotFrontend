using BrokkolyBotFrontend.GeneratedModels;
using BrokkolyBotFrontend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BrokkolyBotFrontend.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class ServersController : Controller
    {
        private readonly DatabaseContext _context;
        private IMemoryCache _cache;

        ServerDataAccessLayer objserver = new ServerDataAccessLayer();

        public ServersController(DatabaseContext context, IMemoryCache memoryCache)
        {
            _context = context;
            _cache = memoryCache;
        }

        // GET: api/Servers
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Server>>> GetServerList()
        {
            return await _context.ServerList.ToListAsync();
        }

        //[HttpGet("{token}")]
        [HttpGet]
        public ActionResult<IEnumerable<Guild>> GetServerListForUser(string token)
        {

            List<Guild> guilds = TryGetBotGuildsFromCache(token);
            if (guilds == null)
            {
                //TODO: return more details or just wait.
                return BadRequest();
            }
            else
            {
                return guilds;
            }
            ////List<string> guildIds = guilds.Select(g => g.id).ToList();
            //List<Server> servers = _context.ServerList.ToList();
            //List<string> serverIds = servers.Select(s => s.ServerId).ToList();
            ////TODO: optimize the search based on length of guilds vs length of servers.
            //List<Guild> botGuilds = guilds.Where(g =>
            //{
            //    int index = serverIds.IndexOf(g.id);
            //    if (index >= 0)
            //    {
            //        g.timeout_role_id = servers[index].TimeoutRoleId.ToString();
            //        g.timeout_seconds = servers[index].TimeoutSeconds;
            //        g.canManageServer = (g.permissions & 0x00000020) == 0x00000020;
            //        return true;
            //    }
            //    return false;
            //}
            //).ToList();
            //return botGuilds;
        }

        public List<Guild> TryGetBotGuildsFromCache(string token)
        {
            List<Guild> cacheGuilds;
            if (!_cache.TryGetValue(CacheKeys.BotGuilds + token, out cacheGuilds))
            {
                List<Guild> allGuilds = DiscordController.GetServersForUser(token);
                List<Server> servers = _context.ServerList.ToList();
                List<string> serverIds = servers.Select(s => s.ServerId).ToList();
                //TODO: optimize the search based on length of guilds vs length of servers.
                cacheGuilds = allGuilds.Where(g =>
                {
                    int index = serverIds.IndexOf(g.id);
                    if (index >= 0)
                    {
                        g.timeout_role_id = servers[index].TimeoutRoleId.ToString();
                        g.timeout_seconds = servers[index].TimeoutSeconds;
                        g.canManageServer = (g.permissions & 0x00000020) == 0x00000020;
                        return true;
                    }
                    return false;
                }
                ).ToList();

                var cacheEntryOptions = new MemoryCacheEntryOptions().SetSlidingExpiration(TimeSpan.FromSeconds(60));
                _cache.Set(CacheKeys.BotGuilds + token, cacheGuilds, cacheEntryOptions);
            }
            return cacheGuilds;
        }

        public bool UserHasServerPermissions(string serverId, string accessToken)
        {
            List<Guild> guilds = TryGetBotGuildsFromCache(accessToken);
            return guilds.Find(g => (g.id == serverId) && g.canManageServer) != null;

        }

        // GET: api/Servers/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Server>> GetServer(long id)
        {
            var server = await _context.ServerList.FindAsync(id);

            if (server == null)
            {
                return NotFound();
            }

            return server;
        }

        // PUT: api/Servers/5
        // To protect from overposting attacks, enable the specific properties you want to bind to, for
        // more details, see https://go.microsoft.com/fwlink/?linkid=2123754.
        [HttpPut("{id}")]
        public async Task<IActionResult> PutServer(string id, Server server)
        {
            if (!DiscordController.UserHasServerPermissions(id, ""))
            {
                //TODO: get permissions
                return BadRequest();
            }
            if (id != server.ServerId)
            {
                return BadRequest();
            }

            _context.Entry(server).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ServerExists(id))
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

        // POST: api/Servers
        // To protect from overposting attacks, enable the specific properties you want to bind to, for
        // more details, see https://go.microsoft.com/fwlink/?linkid=2123754.
        [HttpPost]
        public async Task<ActionResult<Server>> PostServer(Server server)
        {
            if (!DiscordController.UserHasServerPermissions(server.ServerId, ""))
            {
                //TODO: get permissions
                return BadRequest();
            }
            _context.ServerList.Add(server);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                if (ServerExists(server.ServerId))
                {
                    return Conflict();
                }
                else
                {
                    throw;
                }
            }

            return CreatedAtAction("GetServer", new { id = server.ServerId }, server);
        }

        // DELETE: api/Servers/5
        [HttpDelete("{id}")]
        public async Task<ActionResult<Server>> DeleteServer(string id)
        {
            if (!DiscordController.UserHasServerPermissions(id, ""))
            {
                //TODO: get permissions
                return BadRequest();
            }
            var server = await _context.ServerList.FindAsync(long.Parse(id));
            if (server == null)
            {
                return NotFound();
            }

            _context.ServerList.Remove(server);
            await _context.SaveChangesAsync();

            return server;
        }

        private bool ServerExists(string id)
        {
            return _context.ServerList.Any(e => e.ServerId == id);

        }
    }
}
