using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BrokkolyBotFrontend.Controllers
{
    public class CacheKeys
    {
        public static string Guilds { get { return "_AllGuilds"; } }
        public static string BotGuilds { get { return "_BotGuilds"; } }
        public static string CanEditGuild { get { return "_CanEditGuild"; } }
        public static string Roles { get { return "_Roles"; } }
        public static string UserRoles { get { return "_UserRoles"; } }
    }
}