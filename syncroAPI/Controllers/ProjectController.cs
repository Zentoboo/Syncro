using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using syncroAPI.Data;
using syncroAPI.Models;
using syncroAPI.Models.DTOs;

namespace syncroAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProjectController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ProjectController(ApplicationDbContext context)
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

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProjectSummaryResponse>>> GetProjects()
        {
            var userId = GetCurrentUserId();

            var projects = await _context.ProjectMembers
                .Where(pm => pm.UserId == userId && pm.IsActive)
                .Include(pm => pm.Project)
                    .ThenInclude(p => p.Tasks)
                .Select(pm => new ProjectSummaryResponse
                {
                    Id = pm.Project.Id,
                    Name = pm.Project.Name,
                    Description = pm.Project.Description,
                    StartDate = pm.Project.StartDate,
                    EndDate = pm.Project.EndDate,
                    IsArchived = pm.Project.IsArchived,
                    TaskCount = pm.Project.Tasks.Count,
                    CompletedTaskCount = pm.Project.Tasks.Count(t => t.Status == Models.TaskStatus.Done),
                    UserRole = pm.Role
                })
                .ToListAsync();

            return Ok(projects);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ProjectResponse>> GetProject(int id)
        {
            var userId = GetCurrentUserId();

            var membership = await _context.ProjectMembers
                .FirstOrDefaultAsync(pm => pm.ProjectId == id && pm.UserId == userId && pm.IsActive);

            if (membership == null)
                return Forbid();

            var project = await _context.Projects
                .Include(p => p.CreatedBy)
                .Include(p => p.ProjectMembers.Where(pm => pm.IsActive))
                    .ThenInclude(pm => pm.User)
                .Include(p => p.Tasks)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (project == null)
                return NotFound("Project not found");

            var response = new ProjectResponse
            {
                Id = project.Id,
                Name = project.Name,
                Description = project.Description,
                StartDate = project.StartDate,
                EndDate = project.EndDate,
                CreatedAt = project.CreatedAt,
                UpdatedAt = project.UpdatedAt,
                IsArchived = project.IsArchived,
                CreatedBy = new UserSummaryResponse
                {
                    Id = project.CreatedBy.Id,
                    Username = project.CreatedBy.Username,
                    Email = project.CreatedBy.Email
                },
                Members = project.ProjectMembers.Select(pm => new ProjectMemberResponse
                {
                    Id = pm.Id,
                    User = new UserSummaryResponse
                    {
                        Id = pm.User.Id,
                        Username = pm.User.Username,
                        Email = pm.User.Email
                    },
                    Role = pm.Role,
                    JoinedAt = pm.JoinedAt,
                    IsActive = pm.IsActive
                }).ToList(),
                TaskCount = project.Tasks.Count,
                CompletedTaskCount = project.Tasks.Count(t => t.Status == Models.TaskStatus.Done)
            };

            return Ok(response);
        }

        [HttpPost]
        public async Task<ActionResult<ProjectResponse>> CreateProject([FromBody] CreateProjectRequest request)
        {
            var userId = GetCurrentUserId();
            var userRole = GetCurrentUserRole();

            var project = new Project
            {
                Name = request.Name,
                Description = request.Description,
                StartDate = request.StartDate ?? DateTime.UtcNow,
                EndDate = request.EndDate,
                CreatedByUserId = userId
            };

            _context.Projects.Add(project);
            await _context.SaveChangesAsync();

            var membership = new ProjectMember
            {
                ProjectId = project.Id,
                UserId = userId,
                Role = userRole
            };

            _context.ProjectMembers.Add(membership);
            await _context.SaveChangesAsync();

            var createdProject = await _context.Projects
                .Include(p => p.CreatedBy)
                .Include(p => p.ProjectMembers.Where(pm => pm.IsActive))
                    .ThenInclude(pm => pm.User)
                .FirstAsync(p => p.Id == project.Id);

            var response = new ProjectResponse
            {
                Id = createdProject.Id,
                Name = createdProject.Name,
                Description = createdProject.Description,
                StartDate = createdProject.StartDate,
                EndDate = createdProject.EndDate,
                CreatedAt = createdProject.CreatedAt,
                UpdatedAt = createdProject.UpdatedAt,
                IsArchived = createdProject.IsArchived,
                CreatedBy = new UserSummaryResponse
                {
                    Id = createdProject.CreatedBy.Id,
                    Username = createdProject.CreatedBy.Username,
                    Email = createdProject.CreatedBy.Email
                },
                Members = createdProject.ProjectMembers.Select(pm => new ProjectMemberResponse
                {
                    Id = pm.Id,
                    User = new UserSummaryResponse
                    {
                        Id = pm.User.Id,
                        Username = pm.User.Username,
                        Email = pm.User.Email
                    },
                    Role = pm.Role,
                    JoinedAt = pm.JoinedAt,
                    IsActive = pm.IsActive
                }).ToList(),
                TaskCount = 0,
                CompletedTaskCount = 0
            };

            return CreatedAtAction(nameof(GetProject), new { id = project.Id }, response);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ProjectResponse>> UpdateProject(int id, [FromBody] UpdateProjectRequest request)
        {
            var userId = GetCurrentUserId();

            var membership = await _context.ProjectMembers
                .FirstOrDefaultAsync(pm => pm.ProjectId == id && pm.UserId == userId && pm.IsActive);

            if (membership == null || (membership.Role != "Admin" && membership.Role != "ProjectManager"))
                return Forbid();

            var project = await _context.Projects
                .Include(p => p.CreatedBy)
                .Include(p => p.ProjectMembers.Where(pm => pm.IsActive))
                    .ThenInclude(pm => pm.User)
                .Include(p => p.Tasks)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (project == null)
                return NotFound("Project not found");

            project.Name = request.Name;
            project.Description = request.Description;
            project.StartDate = request.StartDate ?? project.StartDate;
            project.EndDate = request.EndDate;
            project.IsArchived = request.IsArchived;
            project.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var response = new ProjectResponse
            {
                Id = project.Id,
                Name = project.Name,
                Description = project.Description,
                StartDate = project.StartDate,
                EndDate = project.EndDate,
                CreatedAt = project.CreatedAt,
                UpdatedAt = project.UpdatedAt,
                IsArchived = project.IsArchived,
                CreatedBy = new UserSummaryResponse
                {
                    Id = project.CreatedBy.Id,
                    Username = project.CreatedBy.Username,
                    Email = project.CreatedBy.Email
                },
                Members = project.ProjectMembers.Select(pm => new ProjectMemberResponse
                {
                    Id = pm.Id,
                    User = new UserSummaryResponse
                    {
                        Id = pm.User.Id,
                        Username = pm.User.Username,
                        Email = pm.User.Email
                    },
                    Role = pm.Role,
                    JoinedAt = pm.JoinedAt,
                    IsActive = pm.IsActive
                }).ToList(),
                TaskCount = project.Tasks.Count,
                CompletedTaskCount = project.Tasks.Count(t => t.Status == Models.TaskStatus.Done)
            };

            return Ok(response);
        }
        
        [HttpGet("search-users")]
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

        [HttpPost("{id}/members")]
        public async Task<ActionResult<ProjectMemberResponse>> AddProjectMember(int id, [FromBody] AddProjectMemberRequest request)
        {
            var userId = GetCurrentUserId();

            // Get project to check ownership
            var project = await _context.Projects.FindAsync(id);
            if (project == null)
                return NotFound("Project not found");

            var membership = await _context.ProjectMembers
                .FirstOrDefaultAsync(pm => pm.ProjectId == id && pm.UserId == userId && pm.IsActive);

            var isProjectOwner = project.CreatedByUserId == userId;

            // Allow both Admin, ProjectManager, and Project Owner to add members
            if (membership == null || (membership.Role != "Admin" && membership.Role != "ProjectManager" && !isProjectOwner))
                return Forbid("You don't have permission to add members to this project");

            var userToAdd = await _context.Users
                .FirstOrDefaultAsync(u => u.Username == request.Username && u.IsActive);

            if (userToAdd == null)
                return BadRequest("User not found");

            var existingMembership = await _context.ProjectMembers
                .FirstOrDefaultAsync(pm => pm.ProjectId == id && pm.UserId == userToAdd.Id);

            if (existingMembership != null)
            {
                if (existingMembership.IsActive)
                    return BadRequest("User is already a member of this project");

                existingMembership.IsActive = true;
                existingMembership.Role = request.Role;
                existingMembership.JoinedAt = DateTime.UtcNow;
            }
            else
            {
                existingMembership = new ProjectMember
                {
                    ProjectId = id,
                    UserId = userToAdd.Id,
                    Role = request.Role
                };
                _context.ProjectMembers.Add(existingMembership);
            }

            await _context.SaveChangesAsync();

            var response = new ProjectMemberResponse
            {
                Id = existingMembership.Id,
                User = new UserSummaryResponse
                {
                    Id = userToAdd.Id,
                    Username = userToAdd.Username,
                    Email = userToAdd.Email
                },
                Role = existingMembership.Role,
                JoinedAt = existingMembership.JoinedAt,
                IsActive = existingMembership.IsActive
            };

            return Ok(response);
        }

        [HttpDelete("{id}/members/{memberId}")]
        public async Task<IActionResult> RemoveProjectMember(int id, int memberId)
        {
            var userId = GetCurrentUserId();

            // Get the project to check ownership
            var project = await _context.Projects
                .FirstOrDefaultAsync(p => p.Id == id);

            if (project == null)
                return NotFound("Project not found");

            // Check if user is project owner or admin
            var userMembership = await _context.ProjectMembers
                .FirstOrDefaultAsync(pm => pm.ProjectId == id && pm.UserId == userId && pm.IsActive);

            var isProjectOwner = project.CreatedByUserId == userId;
            var isAdmin = userMembership?.Role == "Admin";

            // Allow project owners and admins to remove members
            if (!isProjectOwner && !isAdmin)
                return Forbid("Only project owners and admins can remove members");

            var memberToRemove = await _context.ProjectMembers
                .Include(pm => pm.User)
                .FirstOrDefaultAsync(pm => pm.Id == memberId && pm.ProjectId == id);

            if (memberToRemove == null)
                return NotFound("Member not found");

            // Prevent removing the project creator (project owner cannot be removed)
            if (memberToRemove.UserId == project.CreatedByUserId)
                return BadRequest("Cannot remove project creator");

            // Prevent users from removing themselves
            if (memberToRemove.UserId == userId)
                return BadRequest("You cannot remove yourself from the project");

            // Set member as inactive instead of deleting to preserve data integrity
            memberToRemove.IsActive = false;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProject(int id)
        {
            var userId = GetCurrentUserId();

            var project = await _context.Projects
                .FirstOrDefaultAsync(p => p.Id == id);

            if (project == null)
                return NotFound("Project not found");

            if (project.CreatedByUserId != userId)
                return Forbid();

            _context.Projects.Remove(project);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
    public class UserSearchResponse
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }
}