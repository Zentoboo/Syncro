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
    public class UserController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public UserController(ApplicationDbContext context)
        {
            _context = context;
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.Parse(userIdClaim ?? "0");
        }

        private string GetCurrentUserRole()
        {
            return User.FindFirst(ClaimTypes.Role)?.Value ?? "";
        }

        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<UserSearchResponse>>> SearchUsers([FromQuery] string q)
        {
            // Only allow project managers and admins to search for users
            var userRole = GetCurrentUserRole();
            if (userRole != "Admin" && userRole != "ProjectManager")
                return Forbid("Only admins and project managers can search for users");

            if (string.IsNullOrWhiteSpace(q) || q.Length < 2)
                return BadRequest("Search query must be at least 2 characters long");

            var searchTerm = q.Trim().ToLower();

            var users = await _context.Users
                .Where(u => u.IsActive && 
                           (u.Username.ToLower().Contains(searchTerm) || 
                            u.Email.ToLower().Contains(searchTerm)))
                .Select(u => new UserSearchResponse
                {
                    Id = u.Id,
                    Username = u.Username,
                    Email = u.Email,
                    Role = u.Role
                })
                .OrderBy(u => u.Username)
                .Take(10) // Limit results to prevent performance issues
                .ToListAsync();

            return Ok(users);
        }

        [HttpGet("profile")]
        public async Task<ActionResult<UserProfileResponse>> GetCurrentUserProfile()
        {
            var userId = GetCurrentUserId();
            
            var user = await _context.Users
                .Include(u => u.ProjectMemberships)
                    .ThenInclude(pm => pm.Project)
                .Include(u => u.AssignedTasks)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                return NotFound("User not found");

            var response = new UserProfileResponse
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                Role = user.Role,
                CreatedAt = user.CreatedAt,
                ProjectCount = user.ProjectMemberships.Count(pm => pm.IsActive),
                TaskCount = user.AssignedTasks.Count(t => t.Status != Models.TaskStatus.Done)
            };

            return Ok(response);
        }
    }

    // DTOs for User endpoints
    public class UserSearchResponse
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }

    public class UserProfileResponse
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public int ProjectCount { get; set; }
        public int TaskCount { get; set; }
    }
}