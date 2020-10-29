using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using BrokkolyBotFrontend.GeneratedModels;
using Discord;
using Discord.Rest;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

namespace BrokkolyBotFrontend.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class TwitchController : Controller
    {
        private readonly DatabaseContext _context;
        private readonly IDiscordClient _client;
        private readonly ITwitchConnection _twitch;
        private IMemoryCache _cache;
        public TwitchController(DatabaseContext context, IDiscordClient client, ITwitchConnection twitch, IMemoryCache memoryCache)
        {
            _context = context;
            _client = client;
            _twitch = twitch;
            _cache = memoryCache;
        }

        // GET: api/Twitch/5
        [HttpGet, Route("{username=username}/")]
        public async Task<ActionResult> StreamChange(string username, [FromQuery(Name = "hub.challenge")] string challenge="", [FromQuery(Name ="hub.reason")]string reason="")
        {
            //Response.ContentType = "text/plain";
            //Response.StatusCode = 200;
            //await Response.WriteAsync("challenge");
            //await SendMessage("In StreamChange, challenge was: " + challenge+"\nReason Was: "+reason);
            return Ok(challenge);
        }

        public async Task SendMessage(string message)
        {
            RestGuild guild = (RestGuild)await _client.GetGuildAsync(225374061386006528);
            RestTextChannel channel = await guild.GetTextChannelAsync(718854497245462588);
            await channel.SendMessageAsync(message);
        }

        // POST: api/Twitch/5
        [HttpPost, Route("{username=username}")]
        public async Task<ActionResult> StreamChange(string username, [FromBody] StreamChangeRequest request)
        {
            //await SendMessage("In StreamChange, username was: " + username + "\nrequest was:\n" + JsonConvert.SerializeObject(request));
            Task<List<TwitchUser>> twitchUsersTask = _context.TwitchUsers
                    .AsQueryable()
                    .Where(t => (t.ChannelName == username))
                    .ToListAsync();
            StreamChangeRequest previousRequest = GetStreamInfoFromCache(username);
            if (request.data.Any())
            {

                //Stream Changed
                if (previousRequest.data.Any() && (request.data[0].id == previousRequest.data[0].id))
                {
                    //Duplicate Request. This might happen sometimes. No need to add to cache.
                    return Ok();
                }
                if (!previousRequest.data.Any())
                {
                    //Going Online
                    List<TwitchUser> twitchUsers = await twitchUsersTask;
                    foreach (TwitchUser t in twitchUsers)
                    {
                        //Really iterating over servers here.
                        Task<Server> getServerTask = _context.ServerList.AsQueryable().FirstAsync(s => s.ServerId == t.ServerId);
                        RestGuild guild = (RestGuild)await _client.GetGuildAsync(ulong.Parse(t.ServerId));
                        Task<RestGuildUser> getUserTask = null;
                        Task sendMessageTask = null;
                        if (!string.IsNullOrEmpty(t.DiscordUserId))
                        {
                            //We don't need this yet so we'll do this later.
                            getUserTask = guild.GetUserAsync(ulong.Parse(t.DiscordUserId));
                        }
                        string twitchChannelId = (await getServerTask).TwitchChannel;

                        if (!string.IsNullOrEmpty(twitchChannelId))
                        {
                            string stringToSend = username + " is now live at https://twitch.tv/" + username;

                            RestTextChannel channel = await guild.GetTextChannelAsync(ulong.Parse(twitchChannelId));
                            sendMessageTask = channel.SendMessageAsync(stringToSend);
                        }
                        if (getUserTask != null && !string.IsNullOrEmpty(getServerTask.Result.TwitchLiveRoleId))
                        {
                            IRole twitchLiveRole = guild.GetRole(ulong.Parse(getServerTask.Result.TwitchLiveRoleId));
                            await (await getUserTask).AddRoleAsync(twitchLiveRole);
                        }

                        if (sendMessageTask != null)
                        {
                            await sendMessageTask;
                        }
                    }
                }
            }
            else
            {
                //Stream Offline
                List<TwitchUser> twitchUsers = await twitchUsersTask;
                foreach (TwitchUser t in twitchUsers)
                {
                    //Really iterating over servers here.
                    if (string.IsNullOrEmpty(t.DiscordUserId))
                    {
                        continue;
                    }

                    Task<Server> getServerTask = _context.ServerList.AsQueryable().FirstAsync(s => s.ServerId == t.ServerId);
                    RestGuild guild = (RestGuild)await _client.GetGuildAsync(ulong.Parse(t.ServerId));

                    if (string.IsNullOrEmpty((await getServerTask).TwitchLiveRoleId))
                    {
                        continue;
                    }

                    Task<RestGuildUser> getUserTask = guild.GetUserAsync(ulong.Parse(t.DiscordUserId));
                    IRole twitchLiveRole = guild.GetRole(ulong.Parse(getServerTask.Result.TwitchLiveRoleId));

                    if (twitchLiveRole == null || (await getUserTask) == null)
                    {
                        continue;
                    }
                    await getUserTask.Result.RemoveRoleAsync(twitchLiveRole);
                }
            }
            SetStreamInfoInCache(username, request);
            return Ok();
        }

        public StreamChangeRequest GetStreamInfoFromCache(string username)
        {
            StreamChangeRequest cacheRequest;
            if (!_cache.TryGetValue(CacheKeys.TwitchUsername + username, out cacheRequest))
            {
                cacheRequest = new StreamChangeRequest()
                {
                    data = new List<StreamChangeInfo>()
                };
                var cacheEntryOptions = new MemoryCacheEntryOptions().SetAbsoluteExpiration(new TimeSpan(TimeSpan.TicksPerDay));
                _cache.Set(CacheKeys.TwitchUsername + username, cacheRequest, cacheEntryOptions);
            }
            return cacheRequest;
        }

        public void SetStreamInfoInCache(string username, StreamChangeRequest streamChangeInfo)
        {
            var cacheEntryOptions = new MemoryCacheEntryOptions().SetAbsoluteExpiration(new TimeSpan(TimeSpan.TicksPerDay));
            _cache.Set(CacheKeys.TwitchUsername + username, streamChangeInfo, cacheEntryOptions);
        }

        // GET: api/Twitch/5
        public async Task<ActionResult> RefreshStreams()
        {
            //await SendMessage("In RefreshStreams");
            try
            {
                _twitch.CreateTwitchSubscriptions(_context.TwitchUsers.ToList());
            }
            catch (Exception e)
            {
                var outString = e.ToString();
                for (int i = 0; i < outString.Length; i += 2000)
                {
                    var endLength = outString.Length - i;
                    if (endLength > 2000)
                    {
                        endLength = 2000;
                    }
                    if (endLength < 0)
                    {
                        endLength = endLength * -1;
                    }
                    await SendMessage(outString.Substring(i, endLength));
                }
            }
            return StatusCode(200);
        }
    }
}
