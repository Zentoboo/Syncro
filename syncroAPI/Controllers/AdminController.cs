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
    public class AdminController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AdminController(ApplicationDbContext context)
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

        [HttpGet("users")]
        public async Task<ActionResult<IEnumerable<UserSummaryResponse>>> GetAllUsers([FromQuery] string? search = null)
        {
            // Only admins can view all users
            if (GetCurrentUserRole() != "Admin")
                return Forbid("Only admins can access user management");
            
            var query = _context.Users.AsQueryable();

            // Enhanced search functionality - search by username OR email
            if (!string.IsNullOrWhiteSpace(search))
            {
                search = search.ToLower().Trim();
                query = query.Where(u => 
                    u.Username.ToLower().Contains(search) || 
                    u.Email.ToLower().Contains(search));
            }

            var users = await query
                .Select(u => new UserSummaryResponse
                {
                    Id = u.Id,
                    Username = u.Username,
                    Email = u.Email,
                    Role = u.Role,
                    CreatedAt = u.CreatedAt,
                    IsActive = u.IsActive
                })
                .OrderBy(u => u.Username)
                .ToListAsync();

            return Ok(users);
        }

        [HttpPut("users/{userId}/role")]
        public async Task<IActionResult> UpdateUserRole(int userId, [FromBody] UpdateUserRoleRequest request)
        {
            // Only admins can change user roles
            if (GetCurrentUserRole() != "Admin")
                return Forbid("Only admins can change user roles");

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return NotFound("User not found");

            // Validate role - Only allow ProjectManager and Contributor
            var validRoles = new[] { "ProjectManager", "Contributor" };
            if (!validRoles.Contains(request.Role))
                return BadRequest("Invalid role specified. Only ProjectManager and Contributor roles are allowed.");

            // Prevent admin from changing their own role
            var currentUserId = GetCurrentUserId();
            if (userId == currentUserId)
                return BadRequest("You cannot change your own role");

            // Prevent changing other admin's roles
            if (user.Role == "Admin")
                return BadRequest("Cannot change the role of an admin user");

            user.Role = request.Role;
            await _context.SaveChangesAsync();

            return Ok(new { message = "User role updated successfully" });
        }

        [HttpPut("users/{userId}/ban")]
        public async Task<IActionResult> BanUser(int userId)
        {
            // Only admins can ban users
            if (GetCurrentUserRole() != "Admin")
                return Forbid("Only admins can ban users");

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return NotFound("User not found");

            // Prevent admin from banning themselves
            var currentUserId = GetCurrentUserId();
            if (userId == currentUserId)
                return BadRequest("You cannot ban yourself");

            // Prevent banning other admins
            if (user.Role == "Admin")
                return BadRequest("Cannot ban an admin user");

            user.IsActive = false;
            await _context.SaveChangesAsync();

            return Ok(new { message = $"User '{user.Username}' has been banned successfully" });
        }

        [HttpPut("users/{userId}/unban")]
        public async Task<IActionResult> UnbanUser(int userId)
        {
            // Only admins can unban users
            if (GetCurrentUserRole() != "Admin")
                return Forbid("Only admins can unban users");

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return NotFound("User not found");

            user.IsActive = true;
            await _context.SaveChangesAsync();

            return Ok(new { message = $"User '{user.Username}' has been unbanned successfully" });
        }

        [HttpGet("users/{userId}")]
        public async Task<ActionResult<UserDetailResponse>> GetUser(int userId)
        {
            // Only admins can view user details
            if (GetCurrentUserRole() != "Admin")
                return Forbid("Only admins can access user details");

            var user = await _context.Users
                .Include(u => u.ProjectMemberships)
                    .ThenInclude(pm => pm.Project)
                .Include(u => u.CreatedProjects)
                .Include(u => u.AssignedTasks)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                return NotFound("User not found");

            var response = new UserDetailResponse
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                Role = user.Role,
                CreatedAt = user.CreatedAt,
                IsActive = user.IsActive,
                ProjectCount = user.ProjectMemberships.Count,
                CreatedProjectCount = user.CreatedProjects.Count,
                AssignedTaskCount = user.AssignedTasks.Count(t => t.Status != Models.TaskStatus.Done)
            };

            return Ok(response);
        }

        [HttpGet("statistics")]
        public async Task<ActionResult<AdminStatisticsResponse>> GetAdminStatistics()
        {
            // Only admins can view admin statistics
            if (GetCurrentUserRole() != "Admin")
                return Forbid("Only admins can access statistics");

            var totalUsers = await _context.Users.CountAsync();
            var activeUsers = await _context.Users.CountAsync(u => u.IsActive);
            var bannedUsers = await _context.Users.CountAsync(u => !u.IsActive);
            var totalProjects = await _context.Projects.CountAsync();
            var totalTasks = await _context.Tasks.CountAsync();
            var activeProjects = await _context.Projects.CountAsync(p => !p.IsArchived);
            
            var usersByRole = await _context.Users
                .Where(u => u.IsActive)
                .GroupBy(u => u.Role)
                .Select(g => new RoleDistribution
                {
                    Role = g.Key,
                    Count = g.Count()
                })
                .ToListAsync();

            var projectsCreatedLastMonth = await _context.Projects
                .CountAsync(p => p.CreatedAt >= DateTime.UtcNow.AddMonths(-1));

            var response = new AdminStatisticsResponse
            {
                TotalUsers = totalUsers,
                ActiveUsers = activeUsers,
                BannedUsers = bannedUsers,
                TotalProjects = totalProjects,
                TotalTasks = totalTasks,
                ActiveProjects = activeProjects,
                UsersByRole = usersByRole,
                ProjectsCreatedLastMonth = projectsCreatedLastMonth
            };

            return Ok(response);
        }
    }

    // DTOs for Admin endpoints
    public class UpdateUserRoleRequest
    {
        public string Role { get; set; } = string.Empty;
    }

    public class UserDetailResponse : UserSummaryResponse
    {
        public DateTime CreatedAt { get; set; }
        public bool IsActive { get; set; }
        public string Role { get; set; } = string.Empty;
        public int ProjectCount { get; set; }
        public int CreatedProjectCount { get; set; }
        public int AssignedTaskCount { get; set; }
    }

    public class AdminStatisticsResponse
    {
        public int TotalUsers { get; set; }
        public int ActiveUsers { get; set; }
        public int BannedUsers { get; set; }
        public int TotalProjects { get; set; }
        public int TotalTasks { get; set; }
        public int ActiveProjects { get; set; }
        public int ProjectsCreatedLastMonth { get; set; }
        public List<RoleDistribution> UsersByRole { get; set; } = new();
    }

    public class RoleDistribution
    {
        public string Role { get; set; } = string.Empty;
        public int Count { get; set; }
    }
}