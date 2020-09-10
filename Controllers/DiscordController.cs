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
    [Route("api/Discord/[action]")]
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
        //public async Task<ActionResult<IEnumerable<DiscordUser>>> DiscordCallback(string state, string code)
        public ActionResult Callback(string code)
        {
            DiscordUser user = new DiscordUser()
            {
                Code = code,
            };
            string clientId = Environment.GetEnvironmentVariable("CLIENT_ID");
            string clientSecret = Environment.GetEnvironmentVariable("CLIENT_SECRET");
            string baseURL = Environment.GetEnvironmentVariable("BASE_URL");
            string redirect_url = baseURL+"/api/discord/callback";

            HttpWebRequest webRequest = (HttpWebRequest)WebRequest.Create("https://discordapp.com/api/oauth2/token");
            webRequest.Method = "POST";
            string parameters = "client_id=" + clientId + "&client_secret=" + clientSecret + "&grant_type=authorization_code&code=" + code + "&redirect_uri=" + redirect_url + "";
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
            return Redirect(baseURL+"/servers/"+access_token);
        }
    }
}
