using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BrokkolyBotFrontend.GeneratedModels;

namespace BrokkolyBotFrontend.Models
{
    public class ServerDataAccessLayer
    {
        DatabaseContext db = new DatabaseContext();

        public IEnumerable<Server> GetAllServers()
        {
            try
            {
                return db.ServerList.ToList();
            }
            catch
            {
                throw;
            }
        }
    }
}
