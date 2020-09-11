﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BrokkolyBotFrontend.Models
{
    public class DiscordUser
    {
        public string State { get; set; }
        public string Code { get; set; }

        public string AccessToken { get; set; }
        public Dictionary<string,string> UserInfoPerServer { get; set; }
    }
}
