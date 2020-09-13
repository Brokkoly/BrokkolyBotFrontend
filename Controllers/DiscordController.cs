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

namespace BrokkolyBotFrontend.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class DiscordController : Controller
    {
        private readonly IConfiguration _configuration;

        public DiscordController(IConfiguration configuration)
        {
            _configuration = configuration;
        }
        // GET: api/Discord
        [HttpGet]
        public ActionResult Callback(string access_token)//, string token_type, string expires_in, string scope, )
        {
            string clientId = Environment.GetEnvironmentVariable("CLIENT_ID");
            string clientSecret = Environment.GetEnvironmentVariable("CLIENT_SECRET");
            string baseURL = Environment.GetEnvironmentVariable("BASE_URL");
            string redirect_url = baseURL + "/api/Discord/Callback/";

            //HttpWebRequest webRequest = (HttpWebRequest)WebRequest.Create(@"https://discord.com/api/oauth2/token");
            //webRequest.Method = "POST";
            //string parameters = "client_id=" + clientId + "&client_secret=" + clientSecret + "&grant_type=authorization_code&code=" + code + "&redirect_uri=" + redirect_url + "";
            //byte[] byteArray = Encoding.UTF8.GetBytes(parameters);
            //webRequest.ContentType = "application/x-www-form-urlencoded";
            //webRequest.ContentLength = byteArray.Length;
            //Stream postStream = webRequest.GetRequestStream();

            ////try
            ////{
            //postStream.Write(byteArray, 0, byteArray.Length);
            //postStream.Close();
            //WebResponse response = webRequest.GetResponse();
            //postStream = response.GetResponseStream();
            //StreamReader reader = new StreamReader(postStream);
            //string responseFromServer = reader.ReadToEnd();

            //string tokenInfo = responseFromServer.Split(',')[0].Split(':')[1];
            //string access_token = tokenInfo.Trim().Substring(1, tokenInfo.Length - 3);
            //if (string.IsNullOrEmpty(access_token))
            //{
            //    access_token = "0";
            //}
            return Redirect(baseURL + "/servers/" + access_token);
            //}
            //catch(Exception e)
            //{
            //    Console.WriteLine(e);
            //    return Redirect(baseURL + "/Error");
            //}
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
            //TODO: 
            return false;
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
    }
}
