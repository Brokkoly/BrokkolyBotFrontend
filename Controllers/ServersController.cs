using BrokkolyBotFrontend.GeneratedModels;
using Discord;
using Discord.Rest;
using Microsoft.AspNetCore.Mvc;
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
        private readonly IMemoryCache _cache;
        private readonly DiscordRestClient _client;

        public ServersController(DatabaseContext context, IMemoryCache memoryCache, IDiscordClient client)
        {
            _context = context;
            _cache = memoryCache;
            _client = (DiscordRestClient)client;
        }

        // GET: api/Servers
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Server>>> GetServerList()
        {
            return await _context.ServerList.AsQueryable().ToListAsync();
        }

        public async Task SendMessage(string message)
        {
            RestGuild guild = (RestGuild)await _client.GetGuildAsync(225374061386006528);
            RestTextChannel channel = await guild.GetTextChannelAsync(718854497245462588);
            await channel.SendMessageAsync(message);
        }


        //[HttpGet("{token}")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Guild>>> GetServerListForUser(string token)
        {
            //await SendMessage("In GetServerListForUser");
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
            if (!_cache.TryGetValue(CacheKeys.BotGuilds + token, out List<Guild> cacheGuilds))
            {
                List<Guild> allGuilds = this.TryGetServersForUserFromCache(token);
                List<Server> servers = _context.ServerList.AsNoTracking().ToList();
                List<string> serverIds = servers.Select(s => s.ServerId).ToList();
                allGuilds.RemoveAll(g =>
                {
                    return !serverIds.Contains(g.id);
                });
                Dictionary<string, bool> userHasManagerRoleMap = new Dictionary<string, bool>();
                string userId = TryGetUserIdFromAccessTokenFromCache(token);
                foreach (Guild g in allGuilds)
                {
                    userHasManagerRoleMap.Add(g.id, await GetUserHasBotManagerRoleForServer(g.id, userId));
                }
                //TODO: optimize the search based on length of guilds vs length of servers.
                cacheGuilds = allGuilds.Where((g) =>
                {
                    int index = servers.FindIndex(s => s.ServerId == g.id);
                    if (index >= 0)
                    {
                        //TODO: is timeout role id needed by the client?
                        g.timeout_role_id = servers[index].TimeoutRoleId.ToString();
                        g.timeout_seconds = servers[index].TimeoutSeconds;
                        userHasManagerRoleMap.TryGetValue(g.id.ToString(), out bool hasManagerRole);
                        g.canManageServer = ((g.permissions & 0x00000020) == 0x00000020) || hasManagerRole;
                        g.botManagerRoleId = servers[index].BotManagerRoleId;
                        g.commandPrefix = servers[index].CommandPrefix;
                        g.twitchChannelId = servers[index].TwitchChannel;
                        g.twitchLiveRoleId = servers[index].TwitchLiveRoleId;

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
            if (!_cache.TryGetValue(CacheKeys.Guilds + accessToken, out List<Guild> cacheGuilds))
            {
                //_client.GetGuildsAsync(CacheMode=CacheMode.AllowDownload,RequestOptions.Default)
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
            if (!_cache.TryGetValue(CacheKeys.UserId + accessToken, out string userId))
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
            Task<Server> serverFromDb = _context.ServerList.AsNoTracking().FirstAsync(g => g.ServerId == serverId);
            Task<RestGuild> getGuildTask = _client.GetGuildAsync(ulong.Parse(serverId));
            Task<RestGuildUser> getUserTask = (await getGuildTask).GetUserAsync(ulong.Parse(userId));
            var serverBotManagerRoleId = (await serverFromDb).BotManagerRoleId ?? "0";
            return (await getUserTask).RoleIds.Contains(ulong.Parse(serverBotManagerRoleId));
        }

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
                return Forbid();
            }
            if (!String.IsNullOrEmpty(server.CommandPrefix))
            {
                if (!System.Text.RegularExpressions.Regex.IsMatch(server.CommandPrefix, pattern: "^[!-~]{1,2}$"))
                {
                    return BadRequest();
                }
            }
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
            if (!_cache.TryGetValue(CacheKeys.CanEditGuild + token + serverId, out bool cacheResult))
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
