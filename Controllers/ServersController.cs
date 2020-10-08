using BrokkolyBotFrontend.GeneratedModels;
using BrokkolyBotFrontend.Models;
using Discord;
using Microsoft.AspNetCore.Mvc;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;

namespace BrokkolyBotFrontend.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class ServersController : Controller
    {
        private readonly DatabaseContext _context;
        private IMemoryCache _cache;
        private readonly IDiscordClient _client;

        public ServersController(DatabaseContext context, IMemoryCache memoryCache, IDiscordClient client)
        {
            _context = context;
            _cache = memoryCache;
            _client = client;
        }

        // GET: api/Servers
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Server>>> GetServerList()
        {
            return await _context.ServerList.AsQueryable().ToListAsync();
        }

        //[HttpGet("{token}")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Guild>>> GetServerListForUser(string token)
        {

            List<Guild> guilds = await TryGetBotGuildsFromCache(token);
            if (guilds == null)
            {
                //TODO: return more details or just wait.
                return BadRequest("Could Not Retrieve Guilds");
            }
            else
            {
                return guilds;
            }
        }

        public async Task<List<Guild>> TryGetBotGuildsFromCache(string token)
        {
            List<Guild> cacheGuilds;
            if (!_cache.TryGetValue(CacheKeys.BotGuilds + token, out cacheGuilds))
            {
                List<Guild> allGuilds = this.TryGetServersForUserFromCache(token);
                List<Server> servers = _context.ServerList.AsNoTracking().ToList();
                List<string> serverIds = servers.Select(s => s.ServerId).ToList();
                Dictionary<string, bool> userHasManagerRoleMap = new Dictionary<string, bool>();
                string userId = TryGetUserIdFromAccessTokenFromCache(token);
                foreach (string s in serverIds)
                {
                    userHasManagerRoleMap.Add(s, await GetUserHasBotManagerRoleForServer(s, userId));
                }
                //TODO: optimize the search based on length of guilds vs length of servers.
                cacheGuilds = allGuilds.Where((g) =>
                {
                    int index = serverIds.IndexOf(g.id);
                    if (index >= 0)
                    {
                        //TODO: is timeout role id needed by the client?
                        g.timeout_role_id = servers[index].TimeoutRoleId.ToString();
                        g.timeout_seconds = servers[index].TimeoutSeconds;
                        bool hasManagerRole = false;
                        userHasManagerRoleMap.TryGetValue(g.id.ToString(), out hasManagerRole);
                        g.canManageServer = ((g.permissions & 0x00000020) == 0x00000020) || hasManagerRole;
                        g.botManagerRoleId = servers[index].BotManagerRoleId;
                        g.commandPrefix = servers[index].CommandPrefix;
                        g.twitchChannelId = servers[index].TwitchChannel;
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
        public List<Guild> TryGetServersForUserFromCache(string accessToken)
        {
            List<Guild> cacheGuilds;
            if (!_cache.TryGetValue(CacheKeys.Guilds + accessToken, out cacheGuilds))
            {
                cacheGuilds = DiscordController.GetServersForUser(accessToken);
                var cacheEntryOptions = new MemoryCacheEntryOptions().SetSlidingExpiration(System.TimeSpan.FromSeconds(60));
                _cache.Set(CacheKeys.Guilds + accessToken, cacheGuilds, cacheEntryOptions);
            }
            return cacheGuilds;
        }



        public async Task<bool> UserHasServerPermissions(string serverId, string accessToken)
        {
            List<Guild> guilds = await TryGetBotGuildsFromCache(accessToken);
            return guilds.Find(g => (g.id == serverId) && g.canManageServer) != null;

        }

        public string TryGetUserIdFromAccessTokenFromCache(string accessToken)
        {
            string userId = "";
            if (!_cache.TryGetValue(CacheKeys.UserId + accessToken, out userId))
            {
                HttpWebRequest webRequest = (HttpWebRequest)WebRequest.Create(@"https://discord.com/api/users/@me");
                webRequest.Method = "Get";
                webRequest.ContentType = "application/json";
                webRequest.Headers.Add("Authorization", "Bearer " + accessToken);
                var webResponse = webRequest.GetResponse();
                var responseStream = webResponse.GetResponseStream();
                if (responseStream == null) return null;
                var streamReader = new StreamReader(responseStream, Encoding.Default);
                var json = streamReader.ReadToEnd();
                dynamic userObject = JsonConvert.DeserializeObject(json);
                userId = userObject.id;
                if (userId != null && userId != "")
                {
                    var cacheEntryOptions = new MemoryCacheEntryOptions().SetSlidingExpiration(System.TimeSpan.FromSeconds(600000));
                    _cache.Set(CacheKeys.Guilds + accessToken, userId, cacheEntryOptions);
                }
            }
            return userId;
            //TODO: 
        }

        public async Task<bool> GetUserHasBotManagerRoleForServer(string serverId, string userId)
        {
            bool cacheUserHasBotManagerRole = false;

            Task<Server> serverFromDb = _context.ServerList.AsNoTracking().FirstAsync(g => g.ServerId == serverId);
            Task<IGuild> guild = _client.GetGuildAsync(ulong.Parse(serverId), CacheMode.AllowDownload);
            Task<IGuildUser> user = (await guild).GetUserAsync(ulong.Parse(userId));
            var serverBotManagerRoleId = (await serverFromDb).BotManagerRoleId ?? "0";
            return (await user).RoleIds.Contains(ulong.Parse(serverBotManagerRoleId));

        }

        // GET: api/Servers/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Server>> GetServer(string id)
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
        [HttpPut]
        public async Task<IActionResult> PutServer([FromBody] JObject data)
        {
            Server server = data["server"].ToObject<Server>();
            string token = data["token"].ToObject<string>();
            if (!await UserHasServerPermissions(server.ServerId, token))
            {
                //TODO: get permissions
                return Forbid();
            }
            if (!System.Text.RegularExpressions.Regex.IsMatch(server.CommandPrefix, pattern: "^[!-~]{1,2}$"))
            {
                return BadRequest();
            }
            //server.TimeoutRoleId = (await _context.ServerList.FindAsync(server.ServerId)).TimeoutRoleId;

            _context.Entry(server).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ServerExists(server.ServerId))
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
        public async Task<bool> TryGetUserHasServerPermissions(string serverId, string token)
        {
            bool cacheResult;
            if (!_cache.TryGetValue(CacheKeys.CanEditGuild + token + serverId, out cacheResult))
            {
                cacheResult = await UserHasServerPermissions(serverId, token);
                var cacheEntryOptions = new MemoryCacheEntryOptions().SetSlidingExpiration(System.TimeSpan.FromSeconds(60));
                _cache.Set(CacheKeys.CanEditGuild + token + serverId, cacheResult, cacheEntryOptions);
            }
            return cacheResult;
        }

        private bool ServerExists(string id)
        {
            return _context.ServerList.Any(e => e.ServerId == id);
        }
    }
}
