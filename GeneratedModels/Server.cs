using System;
using System.Collections.Generic;

namespace BrokkolyBotFrontend.GeneratedModels
{
    public partial class Server
    {
        public string ServerId { get; set; }
        public int? TimeoutSeconds { get; set; }
        public long? TimeoutRoleId { get; set; }
        public string BotManagerRoleId { get; set; }
        public string CommandPrefix { get; set; }
        public string TwitchChannel { get; set; }
    }
}
