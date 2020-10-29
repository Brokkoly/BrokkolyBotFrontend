using BrokkolyBotFrontend.GeneratedModels;
using Discord.Rest;
using Discord.WebSocket;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Scaffolding.Metadata;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System;
using System.Threading.Tasks;

namespace BrokkolyBotFrontend
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            var host = CreateHostBuilder(args).Build();
            using (var serviceScope = host.Services.CreateScope())
            {
                var services = serviceScope.ServiceProvider;
                try
                {
                    var client = services.GetService<Discord.IDiscordClient>();
                    await ((DiscordRestClient)client).LoginAsync(Discord.TokenType.Bot, Environment.GetEnvironmentVariable("BOT_TOKEN"));
                    //await ((DiscordRestClient)client).StartAsync();

                    //var db = services.GetService<DatabaseContext>();
                    //var usersTask = db.TwitchUsers.AsNoTracking().ToListAsync();
                    //var twitch = services.GetService<TwitchConnection>();
                    //twitch.CreateTwitchSubscriptions(await usersTask);

                }
                catch (Exception ex)
                {
                    Console.WriteLine(ex.ToString());
                }

            }

            host.Run();
        }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder.UseStartup<Startup>();
                });
    }
}
