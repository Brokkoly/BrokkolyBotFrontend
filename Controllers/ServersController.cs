using BrokkolyBotFrontend.GeneratedModels;
using BrokkolyBotFrontend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BrokkolyBotFrontend.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class ServersController : Controller
    {
        private readonly DatabaseContext _context;

        ServerDataAccessLayer objserver = new ServerDataAccessLayer();

        public ServersController(DatabaseContext context)
        {
            _context = context;
        }

        // GET: api/Servers
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Server>>> GetServerList()
        {
            return await _context.ServerList.ToListAsync();
        }

        [HttpGet]
        //[Route("api/Servers/Index")]
        public ActionResult<IEnumerable<Server>> Index()
        {
            var servers = new List<Server> { new Server
            {
                ServerId="4206969",
                TimeoutSeconds=5,
                TimeoutRoleId = 6942069
            } };
            return Ok(servers);
            //IEnumerable<Server> servers = objserver.GetAllServers();
            //return servers;
        }

        // GET: api/Servers/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Server>> GetServer(long id)
        {
            var server = await _context.ServerList.FindAsync(id);

            if (server == null)
            {
                return NotFound();
            }

            return server;
        }

        // PUT: api/Servers/5
        // To protect from overposting attacks, enable the specific properties you want to bind to, for
        // more details, see https://go.microsoft.com/fwlink/?linkid=2123754.
        [HttpPut("{id}")]
        public async Task<IActionResult> PutServer(string id, Server server)
        {
            if (id != server.ServerId)
            {
                return BadRequest();
            }

            _context.Entry(server).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ServerExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // POST: api/Servers
        // To protect from overposting attacks, enable the specific properties you want to bind to, for
        // more details, see https://go.microsoft.com/fwlink/?linkid=2123754.
        [HttpPost]
        public async Task<ActionResult<Server>> PostServer(Server server)
        {
            _context.ServerList.Add(server);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                if (ServerExists(server.ServerId))
                {
                    return Conflict();
                }
                else
                {
                    throw;
                }
            }

            return CreatedAtAction("GetServer", new { id = server.ServerId }, server);
        }

        // DELETE: api/Servers/5
        [HttpDelete("{id}")]
        public async Task<ActionResult<Server>> DeleteServer(string id)
        {
            var server = await _context.ServerList.FindAsync(long.Parse(id));
            if (server == null)
            {
                return NotFound();
            }

            _context.ServerList.Remove(server);
            await _context.SaveChangesAsync();

            return server;
        }

        private bool ServerExists(string id)
        {
            return _context.ServerList.Any(e => e.ServerId == id);

        }
    }
}
