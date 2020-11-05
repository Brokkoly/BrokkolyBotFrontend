using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.WebSockets;
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
        private readonly IMemoryCache _cache;
        public TwitchController(DatabaseContext context, IDiscordClient client, ITwitchConnection twitch, IMemoryCache memoryCache)
        {
            _context = context;
            _client = client;
            _twitch = twitch;
            _cache = memoryCache;
        }

#pragma warning disable IDE0060 // Remove unused parameter
        // GET: api/Twitch/5
        [HttpGet, Route("{username=username}/")]
        public async Task<ActionResult> StreamChange(string username, [FromQuery(Name = "hub.challenge")] string challenge = "", [FromQuery(Name = "hub.reason")] string reason = "")
#pragma warning restore IDE0060 // Remove unused parameter
        {
            if (!string.IsNullOrEmpty(reason))
            {
                await SendMessage("Sub failure. Reason: " + reason);
            }
            if (!string.IsNullOrEmpty(challenge))
            {
                //await SendMessage("Challenge for " + username + " was: " + challenge);
            }
            return Ok(challenge);
        }



        // POST: api/Twitch/5
        [HttpPost, Route("{username=username}/")]
        public async Task<ActionResult> StreamChange(string username, [FromBody] StreamStatusJson request)
        {
            Task<List<TwitchUser>> twitchUsersTask = _context.TwitchUsers
                    .AsQueryable()
                    .Where(t => (t.ChannelName == username))
                    .ToListAsync();
            StreamStatus previousStatus = GetStreamStatusFromCache(username);
            //await SendMessage(username + "'s stream was updated.");
            bool previousStatusOk = true;
            if (previousStatus == null)
            {
                previousStatusOk = false;
            }
            if (request.data.Any())
            {

                //Stream Changed
                if (previousStatusOk && (request.data[0].id == previousStatus.id))
                {
                    //Duplicate Request. This might happen sometimes. No need to add to cache.
                    return Ok();
                }
                else
                {
                    //Going Online
                    //TODO: Don't post messages if the stream was online before.
                    if (previousStatusOk)
                    {
                        //Stream was updated. Handle game changes here
                    }
                    else
                    {
                        //await SendMessage("It went online");
                        await StreamOnline(await twitchUsersTask, request.data[0]);
                    }
                }
            }
            else
            {
                //Stream Offline
                //await SendMessage("It went offline");
                await StreamOffline(await twitchUsersTask);
            }
            SetStreamInfoInCache(username, request);
            return Ok();
        }

        [HttpGet]
        // GET: api/Twitch/5
        public async Task<ActionResult> RefreshStreams(string username = "", string serverId = "")
        {
            var users = _context.TwitchUsers.AsNoTracking();
            if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(serverId))
            {
                //Refresh all streams. Maybe cache the time that streams were last refreshed and do a check every hour.
                var usernames = await users.Select(u => u.ChannelName).Distinct().ToListAsync();
                var streamStatuses = _twitch.GetStreamStatus(usernames);

                foreach (string name in usernames)
                {
                    streamStatuses.TryGetValue(name.ToLower(), out StreamStatus streamStatus);
                    var userListForUserTask = users.Where(u => u.ChannelName == name).ToListAsync();
                    SetStreamInfoInCache(name, streamStatus);
                    await UpdateStreamAcrossServers(await userListForUserTask, streamStatus);
                }
                _twitch.RemoveTwitchSubscriptions(usernames);
                _twitch.CreateTwitchSubscriptions(usernames);
            }
            else
            {
                //Somebody was just added to the bot. We need to check their status.
                StreamStatus streamStatus = GetStreamStatusFromCache(username);
                if (streamStatus == null)
                {
                    //We don't have info
                    var streamStatusesDict = _twitch.GetStreamStatus(new List<string> { username });
                    streamStatusesDict.TryGetValue(username.ToLower(), out streamStatus);
                }
                await UpdateStreamAcrossServers(users.Where(u => u.ChannelName == username).ToList(), streamStatus);
                _twitch.RemoveTwitchSubscriptions(new List<string> { username });
                _twitch.CreateTwitchSubscriptions(new List<string> { username });
            }
            return StatusCode(200);
        }

        [NonAction]
        public async Task SendMessage(string message)
        {
            RestGuild guild = (RestGuild)await _client.GetGuildAsync(225374061386006528);
            RestTextChannel channel = await guild.GetTextChannelAsync(718854497245462588);
            await channel.SendMessageAsync(message);
        }

        [NonAction]
        public StreamStatus GetStreamStatusFromCache(string username)
        {
            if (!_cache.TryGetValue(CacheKeys.TwitchUsername + username, out StreamStatus cacheStatus))
            {
                return null;
            }
            return cacheStatus;
        }

        [NonAction]
        public void SetStreamInfoInCache(string username, StreamStatusJson streamChangeInfo)
        {
            if (streamChangeInfo.data.Any())
            {
                SetStreamInfoInCache(username, streamChangeInfo.data[0]);
            }
            else
            {
                _cache.Remove(CacheKeys.TwitchUsername + username);
            }
        }

        [NonAction]
        public void SetStreamInfoInCache(string username, StreamStatus streamStatus)
        {
            if (streamStatus != null)
            {
                var cacheEntryOptions = new MemoryCacheEntryOptions().SetAbsoluteExpiration(new TimeSpan(TimeSpan.TicksPerDay));
                _cache.Set(CacheKeys.TwitchUsername + username, streamStatus, cacheEntryOptions);
            }
            else
            {
                _cache.Remove(CacheKeys.TwitchUsername + username);
            }

        }

        [NonAction]
        public async Task UpdateStreamAcrossServers(List<TwitchUser> userList, StreamStatus streamStatus = null)
        {
            if (streamStatus == null)
            {
                //offline
                await StreamOffline(userList);
            }
            else
            {
                await StreamOnline(userList, streamStatus);
            }
        }

        [NonAction]
        public async Task StreamOnline(List<TwitchUser> userList, StreamStatus streamStatus)
        {
            foreach (TwitchUser t in userList)
            {
                //Really iterating over servers here.
                Task<Server> getServerTask = _context.ServerList.AsQueryable().FirstAsync(s => s.ServerId == t.ServerId);
                RestGuild guild = (RestGuild)await _client.GetGuildAsync(ulong.Parse(t.ServerId));
                Task<RestGuildUser> getUserTask = null;
                if (!string.IsNullOrEmpty(t.DiscordUserId))
                {
                    //We don't need this yet so we'll do this later.
                    getUserTask = guild.GetUserAsync(ulong.Parse(t.DiscordUserId));
                }
                Server server = await getServerTask;
                string twitchChannelId = server.TwitchChannel;
                RestGuildUser user = null;
                if (getUserTask != null)
                {
                    user = await getUserTask;
                }

                if (user != null && !string.IsNullOrEmpty(server?.TwitchLiveRoleId))
                {
                    //We need to update the role
                    IRole twitchLiveRole = guild.GetRole(ulong.Parse(server.TwitchLiveRoleId));
                    await user.AddRoleAsync(twitchLiveRole);
                }
                if (!string.IsNullOrEmpty(twitchChannelId))
                {
                    //We post updates to the channel, so now we need to see if we've already posted.
                    string streamUrl = "https://twitch.tv/" + t.ChannelName;
                    DateTimeOffset streamStartedUTC = streamStatus.started_at;
                    RestTextChannel channel = await guild.GetTextChannelAsync(ulong.Parse(twitchChannelId));

                    //Find whether or not we've selected a message
                    ulong lastMessageId = 0;
                    bool sendMessage = true;
                    while (true)
                    {
                        IAsyncEnumerable<IReadOnlyCollection<RestMessage>> messagesUnflattened =
                            lastMessageId == 0 ? channel.GetMessagesAsync(100) : channel.GetMessagesAsync(lastMessageId, Direction.Before, 100);
                        List<RestMessage> messages = (await messagesUnflattened.FlattenAsync()).ToList();

                        var myMessages = messages.Where(m => m.Author.Id == _client.CurrentUser.Id &&
                        m.Timestamp > streamStartedUTC && m.Content.Contains(streamUrl)).ToList();
                        if (myMessages.Any())
                        {
                            //Already sent message. We don't need to send it again
                            sendMessage = false;
                            break;
                        }
                        else
                        {
                            if (messages.Last().Timestamp < streamStartedUTC)
                            {
                                //We're past when the stream started
                                break;
                            }
                        }
                        lastMessageId = messages.Last().Id;
                    }

                    if (sendMessage)
                    {
                        //We still need to send the message
                        string stringToSend = "";
                        if (user != null && String.IsNullOrEmpty(user?.Nickname))
                        {
                            stringToSend += !String.IsNullOrEmpty(user.Nickname) ? user.Nickname : user.Username;
                        }
                        else
                        {
                            stringToSend += t.ChannelName;
                        }
                        stringToSend += " is now live at " + streamUrl;
                        await channel.SendMessageAsync(stringToSend);
                    }
                }
            }
        }

        [NonAction]
        public async Task StreamOffline(List<TwitchUser> userList)
        {
            foreach (TwitchUser t in userList)
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


    }
}
