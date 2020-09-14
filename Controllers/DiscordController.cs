using System;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using BrokkolyBotFrontend.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Caching.Memory;

namespace BrokkolyBotFrontend.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class DiscordController : Controller
    {
        private readonly IConfiguration _configuration;
        private IMemoryCache _cache;
        public DiscordController(IConfiguration configuration, IMemoryCache memoryCache)
        {
            _configuration = configuration;
            _cache = memoryCache;
        }
        // GET: api/Discord
        [HttpGet]
        public ActionResult Callback(string access_token)
        {
            //TODO: Probably delete me
            string clientId = Environment.GetEnvironmentVariable("CLIENT_ID");
            string clientSecret = Environment.GetEnvironmentVariable("CLIENT_SECRET");
            string baseURL = Environment.GetEnvironmentVariable("BASE_URL");
            string redirect_url = baseURL + "/api/Discord/Callback/";


            return Redirect(baseURL + "/servers/" + access_token);
        }

        public static List<Guild> GetServersForUser(string access_token)
        {
            HttpWebRequest webRequest = (HttpWebRequest)WebRequest.Create(@"https://discord.com/api/users/@me/guilds");
            webRequest.Method = "Get";
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
            List<Guild> guilds = GetServersForUser(accessToken);
            return guilds.Find(g =>
            {
                return (g.id == serverId) && (g.permissions & 0x00000020) == 0x00000020;
            }) != null;
        }
    }

    public class Guild
    {
        public string id { get; set; }
        public string name { get; set; }
        public string icon { get; set; }
        public bool owner { get; set; }
        public int permissions { get; set; }
        public string permissions_new { get; set; }
        public string? timeout_role_id { get; set; }
        public int? timeout_seconds { get; set; }

        public bool canManageServer { get; set; }
    }
}
