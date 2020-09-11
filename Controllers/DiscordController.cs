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
using Microsoft.Extensions.Configuration;

namespace BrokkolyBotFrontend.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class DiscordController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public DiscordController(IConfiguration configuration)
        {
            _configuration = configuration;
        }
        // GET: api/Discord
        [HttpGet]
        public ActionResult Callback(string code)
        {
            string clientId = Environment.GetEnvironmentVariable("CLIENT_ID");
            string clientSecret = Environment.GetEnvironmentVariable("CLIENT_SECRET");
            string baseURL = Environment.GetEnvironmentVariable("BASE_URL");
            string redirect_url = baseURL + "/api/Discord/Callback";

            HttpWebRequest webRequest = (HttpWebRequest)WebRequest.Create(@"https://discord.com/api/oauth2/token");
            webRequest.Method = "POST";
            webRequest.UserAgent = "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1; .NET CLR 1.1.4322; .NET CLR 2.0.50727)";
            webRequest.Referer = baseURL;
            string parameters = "client_id=" + clientId + "&client_secret=" + clientSecret + "&grant_type=authorization_code&code=" + code + "&redirect_uri=" + redirect_url + "&scope=identify guilds";
            byte[] byteArray = Encoding.UTF8.GetBytes(parameters);
            webRequest.ContentType = "application/x-www-form-urlencoded";
            webRequest.ContentLength = byteArray.Length;
            Stream postStream = webRequest.GetRequestStream();

            postStream.Write(byteArray, 0, byteArray.Length);
            postStream.Close();
            WebResponse response = webRequest.GetResponse();
            postStream = response.GetResponseStream();
            StreamReader reader = new StreamReader(postStream);
            string responseFromServer = reader.ReadToEnd();

            string tokenInfo = responseFromServer.Split(',')[0].Split(':')[1];
            string access_token = tokenInfo.Trim().Substring(1, tokenInfo.Length - 3);
            if (string.IsNullOrEmpty(access_token))
            {
                access_token = "0";
            }
            return Redirect(baseURL + "/servers/" + access_token);
        }

        public static bool UserHasServerPermissions(string serverId, string accessToken)
        {
            //TODO: 
            return false;
        }
    }
}
