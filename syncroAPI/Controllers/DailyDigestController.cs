using Microsoft.AspNetCore.Mvc;
using syncroAPI.Data;
using syncroAPI.Services;
using Microsoft.EntityFrameworkCore;

namespace syncroAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DailyDigestController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IEmailService _emailService;

        public DailyDigestController(ApplicationDbContext context, IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        [HttpPost("send-digests")]
        public async Task<IActionResult> SendDigests([FromQuery] int? projectId = null)
        {
            Console.WriteLine(projectId.HasValue
                ? $"Starting daily digest process for project ID: {projectId.Value}..."
                : "Starting daily digest process for ALL projects...");

            var today = DateTime.UtcNow.Date;
            
            var projectsQuery = _context.Projects
                .Include(p => p.ProjectMembers)
                    .ThenInclude(pm => pm.User)
                .AsQueryable();

            if (projectId.HasValue)
            {
                projectsQuery = projectsQuery.Where(p => p.Id == projectId.Value);
            }

            var projects = await projectsQuery.ToListAsync();

            if (!projects.Any())
            {
                Console.WriteLine(projectId.HasValue ? "Project not found." : "No projects found.");
                return NotFound(projectId.HasValue ? "Project not found." : "No projects found.");
            }

            foreach (var project in projects)
            {
                foreach (var member in project.ProjectMembers)
                {
                    var notifications = await _context.Notifications
                        .Where(n => n.UserId == member.UserId && 
                                    n.RelatedTask.ProjectId == project.Id && 
                                    n.CreatedAt.Date == today)
                        .ToListAsync();

                    if (notifications.Any())
                    {
                        var emailBody = "<h3>Here's your daily digest for " + project.Name + ":</h3><ul>";
                        foreach (var notification in notifications)
                        {
                            emailBody += $"<li>{notification.Message}</li>";
                        }
                        emailBody += "</ul>";

                        await _emailService.SendEmailAsync(new Models.DTOs.EmailNotificationRequest
                        {
                            To = member.User.Email,
                            Subject = $"Your Daily Digest for {project.Name}",
                            Body = emailBody
                        });

                        Console.WriteLine($"Sent digest to {member.User.Email} for project {project.Name}");
                    }
                }
            }

            Console.WriteLine("Daily digest process completed.");
            return Ok("Daily digests sent successfully.");
        }
    }
}