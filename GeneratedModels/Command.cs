using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BrokkolyBotFrontend.GeneratedModels
{
    public partial class Command
    {
        public int Id { get; set; }
        public string ServerId { get; set; }
        public string CommandString { get; set; }
        public string EntryValue { get; set; }
        public int? ModOnly { get; set; }

    }
}
