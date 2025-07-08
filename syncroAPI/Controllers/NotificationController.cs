using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using syncroAPI.Data;
using syncroAPI.Models.DTOs;
using syncroAPI.Services;

namespace syncroAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NotificationController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IEmailService _emailService;

        public NotificationController(ApplicationDbContext context, IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        private int GetCurrentUserId()
        {
            return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        }

        [HttpPost("send-email")]
        public async Task<IActionResult> SendEmailNotification([FromBody] Models.DTOs.EmailNotificationRequest request)
        {
            // Add validation for the request
            if (request == null || string.IsNullOrWhiteSpace(request.To) || string.IsNullOrWhiteSpace(request.Subject) || string.IsNullOrWhiteSpace(request.Body))
            {
                return BadRequest("Email request is missing required fields.");
            }
        
            await _emailService.SendEmailAsync(request);
            return Ok(new { message = "Email sent successfully." });
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<NotificationResponse>>> GetNotifications(
            [FromQuery] int? limit = null,
            [FromQuery] bool? isRead = null)
        {
            var userId = GetCurrentUserId();
            var query = _context.Notifications
                .Include(n => n.TriggeredByUser)
                .Include(n => n.RelatedTask)
                .Where(n => n.UserId == userId);

            // Filter by read status if specified
            if (isRead.HasValue)
            {
                query = query.Where(n => n.IsRead == isRead.Value);
            }

            // Order by creation date (newest first)
            query = query.OrderByDescending(n => n.CreatedAt);

            // Apply limit if specified, otherwise default to 50
            if (limit.HasValue && limit.Value > 0)
            {
                query = query.Take(limit.Value);
            }
            else
            {
                query = query.Take(50); // Default limit
            }

            var notifications = await query
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

            if (notification == null)
                return NotFound("Notification not found");

            if (!notification.IsRead)
            {
                notification.IsRead = true;
                await _context.SaveChangesAsync();
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNotification(int id)
        {
            var userId = GetCurrentUserId();
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

            if (notification == null)
                return NotFound("Notification not found");

            _context.Notifications.Remove(notification);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPost("mark-all-as-read")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var userId = GetCurrentUserId();
            var unreadNotifications = await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();

            foreach (var notification in unreadNotifications)
            {
                notification.IsRead = true;
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = $"Marked {unreadNotifications.Count} notifications as read" });
        }

        [HttpDelete("bulk")]
        public async Task<IActionResult> BulkDeleteNotifications([FromBody] BulkDeleteRequest request)
        {
            var userId = GetCurrentUserId();

            if (request.NotificationIds == null || !request.NotificationIds.Any())
                return BadRequest("No notification IDs provided");

            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId && request.NotificationIds.Contains(n.Id))
                .ToListAsync();

            if (!notifications.Any())
                return NotFound("No notifications found to delete");

            _context.Notifications.RemoveRange(notifications);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Deleted {notifications.Count} notifications" });
        }

        [HttpPost("bulk/mark-as-read")]
        public async Task<IActionResult> BulkMarkAsRead([FromBody] BulkMarkAsReadRequest request)
        {
            var userId = GetCurrentUserId();

            if (request.NotificationIds == null || !request.NotificationIds.Any())
                return BadRequest("No notification IDs provided");

            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId &&
                           request.NotificationIds.Contains(n.Id) &&
                           !n.IsRead)
                .ToListAsync();

            foreach (var notification in notifications)
            {
                notification.IsRead = true;
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = $"Marked {notifications.Count} notifications as read" });
        }

        [HttpGet("statistics")]
        public async Task<ActionResult<NotificationStatisticsResponse>> GetNotificationStatistics()
        {
            var userId = GetCurrentUserId();

            var totalCount = await _context.Notifications.CountAsync(n => n.UserId == userId);
            var unreadCount = await _context.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead);
            var readCount = totalCount - unreadCount;

            // Get notifications from the last 7 days
            var weekAgo = DateTime.UtcNow.AddDays(-7);
            var recentCount = await _context.Notifications
                .CountAsync(n => n.UserId == userId && n.CreatedAt >= weekAgo);

            var statistics = new NotificationStatisticsResponse
            {
                TotalNotifications = totalCount,
                UnreadNotifications = unreadCount,
                ReadNotifications = readCount,
                NotificationsThisWeek = recentCount
            };

            return Ok(statistics);
        }
    }

    // DTOs for bulk operations
    public class BulkDeleteRequest
    {
        public List<int> NotificationIds { get; set; } = new List<int>();
    }

    public class BulkMarkAsReadRequest
    {
        public List<int> NotificationIds { get; set; } = new List<int>();
    }

    public class NotificationStatisticsResponse
    {
        public int TotalNotifications { get; set; }
        public int UnreadNotifications { get; set; }
        public int ReadNotifications { get; set; }
        public int NotificationsThisWeek { get; set; }
    }
}