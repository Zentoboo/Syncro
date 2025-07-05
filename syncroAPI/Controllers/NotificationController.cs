using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using syncroAPI.Data;
using syncroAPI.Models.DTOs;

namespace syncroAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NotificationController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public NotificationController(ApplicationDbContext context)
        {
            _context = context;
        }

        private int GetCurrentUserId()
        {
            return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<NotificationResponse>>> GetNotifications()
        {
            var userId = GetCurrentUserId();
            var notifications = await _context.Notifications
                .Include(n => n.TriggeredByUser)
                .Include(n => n.RelatedTask)
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Take(20) // Limit to the latest 20 notifications
                .Select(n => new NotificationResponse
                {
                    Id = n.Id,
                    Message = n.Message,
                    IsRead = n.IsRead,
                    CreatedAt = n.CreatedAt,
                    RelatedTaskId = n.RelatedTaskId,
                    ProjectId = n.RelatedTask != null ? n.RelatedTask.ProjectId : null,
                    TriggeredByUsername = n.TriggeredByUser.Username
                })
                .ToListAsync();

            return Ok(notifications);
        }

        [HttpPost("{id}/mark-as-read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var userId = GetCurrentUserId();
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

            if (notification == null) return NotFound();

            notification.IsRead = true;
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}