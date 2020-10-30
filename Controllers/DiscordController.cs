using Discord;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Newtonsoft.Json;
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
    public class DiscordController : Controller
    {
        private readonly IMemoryCache _cache;
        private readonly IDiscordClient _client;
        public DiscordController(IMemoryCache memoryCache, IDiscordClient client)
        {
            _cache = memoryCache;
            _client = client;
        }
        // GET: api/Discord
        [HttpGet]
        public ActionResult Callback(string access_token)
        {
            string baseURL = Environment.GetEnvironmentVariable("BASE_URL");
            return Redirect(baseURL + "/servers/" + access_token);
        }

        public static List<Guild> GetServersForUser(string access_token)
        {
            HttpWebRequest webRequest = (HttpWebRequest)WebRequest.Create(@"https://discord.com/api/users/@me/guilds");
            webRequest.Method = "GET";
            webRequest.ContentType = "application/json";
            webRequest.Headers.Add("Authorization", "Bearer " + access_token);
            var webResponse = webRequest.GetResponse();
            var responseStream = webResponse.GetResponseStream();
            if (responseStream == null) return null;
            var streamReader = new StreamReader(responseStream, Encoding.Default);
            var json = streamReader.ReadToEnd();
            List<Guild> guilds = JsonConvert.DeserializeObject<List<Guild>>(json);
            return guilds;
        }
        public static bool UserHasServerPermissions(string serverId, string accessToken)
        {
            //TODO: also need to check for user's roles in the guild
            List<Guild> guilds = GetServersForUser(accessToken);
            return guilds.Find(g =>
            {
                return (g.id == serverId) && (g.permissions & 0x00000020) == 0x00000020;
            }) != null;
        }

        // GET: api/Discord/GetRolesForServer
        [HttpGet]
        public async Task<ActionResult<IEnumerable<MyRole>>> GetRolesForServer([FromQuery] string token, [FromQuery] string serverId)
        {
            if (String.IsNullOrEmpty(token))
            {
                return BadRequest();
            }
            if (String.IsNullOrEmpty(serverId))
            {
                return BadRequest();
            }

            return (await TryGetRolesForServerFromCache(token, serverId));
        }

        [HttpGet]
        public async Task<ActionResult<ServerInfo>> GetServerInfo([FromQuery] string token, [FromQuery] string serverId)
        {
            if (String.IsNullOrEmpty(token))
            {
                return BadRequest();
            }
            if (String.IsNullOrEmpty(serverId))
            {
                return BadRequest();
            }
            return await TryGetServerInfoFromCache(token, serverId);
        }

#pragma warning disable IDE0060 // Remove unused parameter
        public async Task<ActionResult<IEnumerable<MyRole>>> TryGetRolesForServerFromCache(string accessToken, string serverId)
#pragma warning restore IDE0060 // Remove unused parameter
        {
            //TODO: delete when it's time
            List<IRole> roles = new List<IRole>((await _client.GetGuildAsync(ulong.Parse(serverId))).Roles.ToList());
            List<MyRole> myRoles = new List<MyRole>();
            foreach (IRole r in roles)
            {
                myRoles.Add(new MyRole()
                {
                    name = r.Name,
                    color = r.Color.GetHashCode(),
                    position = r.Position,
                    id = r.Id.ToString(),
                });

            }
            return myRoles;
        }
#pragma warning disable IDE0060 // Remove unused parameter
        public async Task<ActionResult<ServerInfo>> TryGetServerInfoFromCache(string accessToken, string serverId)
#pragma warning restore IDE0060 // Remove unused parameter
        {
            //TODO: extract to cache function
            IGuild guild = await _client.GetGuildAsync(ulong.Parse(serverId));
            List<MyRole> myRoles = new List<MyRole>();
            List<MyChannel> myChannels = new List<MyChannel>();
            foreach (IRole r in guild.Roles)
            {
                myRoles.Add(new MyRole()
                {
                    name = r.Name,
                    color = r.Color.GetHashCode(),
                    position = r.Position,
                    id = r.Id.ToString(),
                });
            }
            foreach (IChannel channel in await guild.GetTextChannelsAsync())
            {
                myChannels.Add(new MyChannel()
                {
                    id = channel.Id.ToString(),
                    name = channel.Name,
                });
            }
            return new ServerInfo()
            {
                myChannels = myChannels.ToArray(),
                myRoles = myRoles.ToArray()
            };

        }

        // GET: api/Discord/GetRolesForUser
        [HttpGet]
        public ActionResult<IEnumerable<MyRole>> GetRolesForUser(string accessToken, string serverId)
        {

            if (String.IsNullOrEmpty(accessToken))
            {
                return BadRequest();
            }
            if (String.IsNullOrEmpty(serverId))
            {
                return BadRequest();
            }
            return TryGetRolesForUserFromCache(accessToken, serverId);
        }

        public ActionResult<IEnumerable<MyRole>> TryGetRolesForUserFromCache(string accessToken, string serverId)
        {
            ServerUser serverUser;
            if (!_cache.TryGetValue(CacheKeys.UserRoles + serverId + accessToken, out List<MyRole> cacheRoles))
            {
                HttpWebRequest webRequest = (HttpWebRequest)WebRequest.Create(@"https://discord.com/api/users/@me/guilds");
                webRequest.Method = "Get";
                webRequest.ContentType = "application/json";
                webRequest.Headers.Add("Authorization", "Bearer " + accessToken);
                var webResponse = webRequest.GetResponse();
                var responseStream = webResponse.GetResponseStream();
                if (responseStream == null) return null;
                var streamReader = new StreamReader(responseStream, Encoding.Default);
                var json = streamReader.ReadToEnd();
                serverUser = JsonConvert.DeserializeObject<ServerUser>(json);
                cacheRoles = serverUser.roles;
                var cacheEntryOptions = new MemoryCacheEntryOptions().SetSlidingExpiration(TimeSpan.FromSeconds(60));
                _cache.Set(CacheKeys.UserRoles + serverId + accessToken, cacheRoles, cacheEntryOptions);
            }
            return cacheRoles;
        }
    }

#pragma warning disable IDE1006 // Naming Styles. These are how they are delivered to us or expected by the client

    public class MyRole
    {
        public string id { get; set; }
        public string name { get; set; }
        public int color { get; set; }
        public int position { get; set; }
    }

    public class Guild
    {
        public string id { get; set; }
        public string name { get; set; }
        public string icon { get; set; }
        public bool owner { get; set; }
        public int permissions { get; set; }
        public string permissions_new { get; set; }
        public string timeout_role_id { get; set; }
        public int? timeout_seconds { get; set; }
        public string botManagerRoleId { get; set; }
        public bool canManageServer { get; set; }
        public string commandPrefix { get; set; }
        public string twitchChannelId { get; set; }
        public string twitchLiveRoleId { get; set; }
    }

    public class MyChannel
    {
        public string id { get; set; }
        public string name { get; set; }
    }

    public class ServerInfo
    {
        public MyChannel[] myChannels { get; set; }
        public MyRole[] myRoles { get; set; }
    }

    public class ServerUser
    {
        public Object user { get; set; }
        public string nick { get; set; }
        public List<MyRole> roles { get; set; }
        public string JoinedAt { get; set; }
        public bool deaf { get; set; }
        public bool mute { get; set; }
    }
}
#pragma warning restore IDE1006 // Naming Styles