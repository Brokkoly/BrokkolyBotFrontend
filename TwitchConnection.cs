using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using BrokkolyBotFrontend.GeneratedModels;
using Microsoft.AspNetCore.Http;
using Microsoft.CodeAnalysis.Host.Mef;
using Newtonsoft.Json;

namespace BrokkolyBotFrontend
{
    public interface ITwitchConnection
    {
        string AccessToken { get; set; }
        string ClientId { get; set; }
        string ClientSecret { get; set; }
        public void CreateTwitchSubscriptions(IEnumerable<string> usernames);
        public void RemoveTwitchSubscriptions(IEnumerable<string> usernames);
        public void CreateTwitchSubscription(string username, string id);
        public void RemoveTwitchSubscription(string username, string id);
        public List<TwitchUserInfo> GetUserIds(IList<string> usernames);
        public void Login();
        public void Login(string TwitchId, string TwitchSecret);
        public Dictionary<string, StreamStatus> GetStreamStatus(List<string> usernames);

    }

    // You may need to install the Microsoft.AspNetCore.Http.Abstractions package into your project
    public class TwitchConnection : ITwitchConnection
    {
        public TwitchConnection()
        {
            ClientId = Environment.GetEnvironmentVariable("TWITCH_CLIENT_ID");
            ClientSecret = Environment.GetEnvironmentVariable("TWITCH_CLIENT_SECRET");
            Login();
        }

        public string AccessToken { get; set; }
        public string ClientId { get; set; }
        public string ClientSecret { get; set; }

        public void CreateTwitchSubscriptions(IEnumerable<string> usernames)
        {
            List<List<string>> usernameChunks = ChunkList<string>(usernames.ToList(), 100);
            for (int i = 0; i < usernameChunks.Count; i++)
            {
                this.CreateTwitchSubscriptionsForChunk(usernameChunks[i]);
            }
        }

        public void CreateTwitchSubscriptionsForChunk(List<string> usernames)
        {
            List<TwitchUserInfo> userInfos = GetUserIds(usernames);
            for (int i = 0; i < userInfos.Count; i++)
            {
                CreateTwitchSubscription(userInfos[i].login, userInfos[i].id);
            }
        }

        public void RemoveTwitchSubscriptions(IEnumerable<string> usernames)
        {
            List<List<string>> usernameChunks = ChunkList<string>(usernames.ToList(), 100);
            for (int i = 0; i < usernameChunks.Count; i++)
            {
                this.RemoveTwitchSubscriptionsForChunk(usernameChunks[i]);
            }
        }

        public void RemoveTwitchSubscriptionsForChunk(List<string> usernames)
        {
            List<TwitchUserInfo> userInfos = GetUserIds(usernames);
            for (int i = 0; i < userInfos.Count; i++)
            {
                RemoveTwitchSubscription(userInfos[i].login, userInfos[i].id);
            }
        }

        class Hub
        {
            public static string Callback { get { return "hub.callback"; } }
            public static string Mode { get { return "hub.mode"; } }
            public static string Topic { get { return "hub.topic"; } }
            public static string LeaseSeconds { get { return "hub.lease_seconds"; } }
            public static string Secret { get { return "hub.secret"; } }
        }

        public Dictionary<string, StreamStatus> GetStreamStatus(List<string> usernames)
        {
            List<List<string>> chunkList = ChunkList<string>(usernames, 100);
            Dictionary<string, StreamStatus> retDict = new Dictionary<string, StreamStatus>();
            StreamInfoResponse streamInfoResponse = null;
            foreach (List<string> chunk in chunkList)
            {
                string cursor;
                if (!String.IsNullOrEmpty(streamInfoResponse?.StreamChangeRequest?.pagination?.cursor))
                {
                    cursor = streamInfoResponse.StreamChangeRequest.pagination.cursor;
                }
                else
                {
                    cursor = "";
                }
                streamInfoResponse = DoStreamInfoRequest(chunk, cursor);
                foreach (StreamStatus streamChangeInfo in streamInfoResponse.StreamChangeRequest.data)
                {
                    retDict.Add(streamChangeInfo.user_name.ToLower(), streamChangeInfo);
                }
            }
            return retDict;
        }
        public StreamInfoResponse DoStreamInfoRequest(List<string> usernames, string cursor)
        {
            string queryString = CreateGetStreamString(ref usernames, cursor);
            HttpWebRequest webRequest = (HttpWebRequest)WebRequest.Create(queryString);
            webRequest.Method = "GET";
            webRequest.ContentType = "application/json";
            webRequest.Headers.Add(HttpRequestHeader.Authorization, "Bearer " + AccessToken);
            webRequest.Headers.Add("Client-Id: " + ClientId);
            var webResponse = webRequest.GetResponse();
            var responseStream = webResponse.GetResponseStream();
            if (responseStream != null)
            {

                var streamReader = new StreamReader(responseStream, Encoding.Default);
                var json = streamReader.ReadToEnd();
                StreamStatusJson response = JsonConvert.DeserializeObject<StreamStatusJson>(json);
                return new StreamInfoResponse()
                {
                    StreamChangeRequest = response,
                    RateLimitRemaining = int.Parse(webResponse.Headers.Get("Ratelimit-Remaining"))
                };
            }
            else
            {
                return new StreamInfoResponse()
                {
                    StreamChangeRequest = new StreamStatusJson(),
                    RateLimitRemaining = 800,
                };
            }

        }

        private string CreateGetStreamString(ref List<string> usernames, string cursor)
        {
            StringBuilder sb = new StringBuilder("https://api.twitch.tv/helix/streams");
            sb.Append("?first=");
            sb.Append(usernames.Count.ToString());
            if (!String.IsNullOrEmpty(cursor))
            {
                sb.Append("&after=");
                sb.Append(cursor);
            }
            foreach (string s in usernames)
            {
                sb.Append("&user_login=");
                sb.Append(s);
            }
            return sb.ToString();

        }

        public void CreateTwitchSubscription(string username, string id)
        {
            string subscribeString = CreateSubscribeString(id);
            string callbackString = "https://brokkolybot.azurewebsites.com/api/Twitch/StreamChange/" + username;
            string fetchUrl = "https://api.twitch.tv/helix/webhooks/hub";
            HttpWebRequest webRequest = (HttpWebRequest)WebRequest.Create(fetchUrl);
            webRequest.Method = "POST";
            webRequest.ContentType = "application/json";
            webRequest.Headers.Add(HttpRequestHeader.Authorization, "Bearer " + AccessToken);
            webRequest.Headers.Add("Client-Id: " + ClientId);
            using (var streamWriter = new StreamWriter(webRequest.GetRequestStream()))
            {
                string j = "{" + string.Format("\"{0}\":\"{1}\",", Hub.Callback, callbackString) +
                              string.Format("\"{0}\":\"{1}\",", Hub.Mode, "subscribe") +
                              string.Format("\"{0}\":\"{1}\",", Hub.Topic, subscribeString) +
                              string.Format("\"{0}\":\"{1}\",", Hub.LeaseSeconds, "86400") +
                              string.Format("\"{0}\":\"{1}\"", Hub.Secret, ClientSecret) + "}";

                streamWriter.Write(j);
            }
            webRequest.GetResponse();
        }

        public void RemoveTwitchSubscription(string username, string id)
        {
            string subscribeString = CreateSubscribeString(id);
            string callbackString = "https://brokkolybot.azurewebsites.com/api/Twitch/StreamChange/" + username;
            string fetchUrl = "https://api.twitch.tv/helix/webhooks/hub";
            HttpWebRequest webRequest = (HttpWebRequest)WebRequest.Create(fetchUrl);
            webRequest.Method = "POST";
            webRequest.ContentType = "application/json";
            webRequest.Headers.Add(HttpRequestHeader.Authorization, "Bearer " + AccessToken);
            webRequest.Headers.Add("Client-Id: " + ClientId);
            using (var streamWriter = new StreamWriter(webRequest.GetRequestStream()))
            {
                string j = "{" + string.Format("\"{0}\":\"{1}\",", Hub.Callback, callbackString) +
                              string.Format("\"{0}\":\"{1}\",", Hub.Mode, "subscribe") +
                              string.Format("\"{0}\":\"{1}\",", Hub.Topic, subscribeString) +
                              string.Format("\"{0}\":\"{1}\",", Hub.LeaseSeconds, "86400") +
                              string.Format("\"{0}\":\"{1}\"", Hub.Secret, ClientSecret) + "}";

                streamWriter.Write(j);
            }
            webRequest.GetResponse();
        }

        public void Login()
        {
            Login(ClientId, ClientSecret);
        }
        public void Login(string clientId, string clientSecret)
        {
            string requestString = String.Format(@"https://id.twitch.tv/oauth2/token?&client_id={0}&client_secret={1}&grant_type=client_credentials", clientId, clientSecret);
            HttpWebRequest webRequest = (HttpWebRequest)WebRequest.Create(requestString);
            webRequest.Method = "POST";
            webRequest.ContentType = "application/json";
            webRequest.Headers.Add("Client-Id: " + ClientId);
            var webResponse = webRequest.GetResponse();
            var responseStream = webResponse.GetResponseStream();
            if (responseStream == null) return;
            var streamReader = new StreamReader(responseStream, Encoding.Default);
            var json = streamReader.ReadToEnd();
            TokenResponse response = JsonConvert.DeserializeObject<TokenResponse>(json);
            if (!string.IsNullOrEmpty(response.access_token))
            {
                AccessToken = response.access_token;
            }

        }

        public List<TwitchUserInfo> GetUserIds(IList<string> usernames)
        {
            string getIdsString = CreateGetIdString(usernames);
            HttpWebRequest webRequest = (HttpWebRequest)WebRequest.Create(getIdsString);
            webRequest.Method = "GET";
            webRequest.ContentType = "application/json";
            webRequest.Headers.Add(HttpRequestHeader.Authorization, "Bearer " + AccessToken);
            webRequest.Headers.Add("Client-Id: " + ClientId);
            var webResponse = webRequest.GetResponse();
            var responseStream = webResponse.GetResponseStream();
            if (responseStream == null) return new List<TwitchUserInfo>();
            var streamReader = new StreamReader(responseStream, Encoding.Default);
            var json = streamReader.ReadToEnd();
            TwitchUserInfoResponse response = JsonConvert.DeserializeObject<TwitchUserInfoResponse>(json);
            return response.data;
        }
        private string CreateGetIdString(IList<string> usernames)
        {
            StringBuilder sb = new StringBuilder("https://api.twitch.tv/helix/users?");
            for (int i = 0; i < usernames.Count(); i++)
            {
                if (i != 0)
                {
                    sb.Append("&");
                }
                sb.Append("login=");
                sb.Append(usernames[i]);
            }
            return sb.ToString();
        }

        private string CreateSubscribeString(string id)
        {
            return "https://api.twitch.tv/helix/streams?user_id=" + id;
        }

        private static List<List<T>> ChunkList<T>(List<T> source, int chunkSize)
        {
            //https://stackoverflow.com/a/24087164/14260854
            return source
               .Select((x, i) => new { Index = i, Value = x })
               .GroupBy(x => x.Index / chunkSize)
               .Select(x => x.Select(v => v.Value).ToList())
               .ToList();
        }
    }

    public class TokenResponse
    {
#pragma warning disable IDE1006 // Naming Styles. These are how they are delivered to us or expected by the client
        public string access_token { get; set; }
        public int expires_in { get; set; }
        public string token_type { get; set; }
    }
    public class StreamNotification
    {
        public List<StreamData> data { get; set; }
    }
    public class StreamData
    {
        public string id { get; set; }
        public string user_id { get; set; }
        public string user_name { get; set; }
        public string game_id { get; set; }
        public List<object> community_ids { get; set; }
        public string type { get; set; }
        public string title { get; set; }
        public int viewer_count { get; set; }
        public DateTime started_at { get; set; }
        public string language { get; set; }
        public string thumbnail_url { get; set; }

    }
}

public class TwitchUserInfo
{
    public string id { get; set; }
    public string login { get; set; }
    public string display_name { get; set; }
    public string type { get; set; }
    public string broadcaster_type { get; set; }
    public string description { get; set; }
    public string profile_image_url { get; set; }
    public string offline_image_url { get; set; }
    public int view_count { get; set; }
    public string email { get; set; }
}

public class TwitchUserInfoResponse
{
    public List<TwitchUserInfo> data { get; set; }
}

public class StreamStatus
{
    public string id { get; set; }
    public string user_id { get; set; }
    public string user_name { get; set; }
    public string game_id { get; set; }
    public List<object>? tag_ids { get; set; }
    public string type { get; set; }
    public string title { get; set; }
    public int viewer_count { get; set; }
    public DateTime started_at { get; set; }
    public string language { get; set; }
    public string thumbnail_url { get; set; }
}
public class PaginationClass
{
    public string cursor { get; set; }
}

public class StreamStatusJson
{
    public List<StreamStatus> data { get; set; }
    public PaginationClass pagination { get; set; }

}
public class StreamInfoResponse
{
    public StreamStatusJson StreamChangeRequest { get; set; }
    public int RateLimitRemaining { get; set; }
}
#pragma warning restore IDE1006 // Naming Styles

