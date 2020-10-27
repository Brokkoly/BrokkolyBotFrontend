using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using BrokkolyBotFrontend.GeneratedModels;
using Discord;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace BrokkolyBotFrontend.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class TwitchController : Controller
    {
        private readonly DatabaseContext _context;
        private readonly IDiscordClient _client;
        private readonly ITwitchConnection _twitch;
        public TwitchController(DatabaseContext context, IDiscordClient client, ITwitchConnection twitch)
        {
            _context = context;
            _client = client;
            _twitch = twitch;
        }

        [HttpGet]
        public async Task<ActionResult> StreamChange()
        {

            return StatusCode(200);
        }

        [HttpPost]
        public async Task<ActionResult> StreamChange(string username, [FromBody]StreamChangeRequest request)
        {
            if (request.data.Any())
            {
                //Stream Changed
            }
            else
            {
                //Stream Offline
            }

            return StatusCode(201);
        }


        public async Task<ActionResult> RefreshStreams()
        {
            return StatusCode(200);
        }
    }
}
