using AspNetCore.AsyncInitialization;
using Discord;
using Discord.WebSocket;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BrokkolyBotFrontend
{
    public class DiscordClientInitializer : DiscordSocketClient, IAsyncInitializer
    {
        public DiscordClientInitializer() : base()
        {
        }
        public async Task InitializeAsync()
        {
            await LoginAsync(TokenType.Bot, Environment.GetEnvironmentVariable("BOT_TOKEN"));
            await StartAsync();
        }
    }
}
