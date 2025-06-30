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

            // Check if user is a member of the project
            var membership = await _context.ProjectMembers
                .FirstOrDefaultAsync(pm => pm.ProjectId == id && pm.UserId == userId && pm.IsActive);

            if (membership == null)
                return Forbid("You are not a member of this project");

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

            // Add creator as an admin member
            var membership = new ProjectMember
            {
                ProjectId = project.Id,
                UserId = userId,
                Role = "Admin"
            };

            _context.ProjectMembers.Add(membership);
            await _context.SaveChangesAsync();

            // Reload with includes for response
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

            // Check if user has admin or project manager role
            var membership = await _context.ProjectMembers
                .FirstOrDefaultAsync(pm => pm.ProjectId == id && pm.UserId == userId && pm.IsActive);

            if (membership == null || (membership.Role != "Admin" && membership.Role != "ProjectManager"))
                return Forbid("You don't have permission to update this project");

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

        [HttpPost("{id}/members")]
        public async Task<ActionResult<ProjectMemberResponse>> AddProjectMember(int id, [FromBody] AddProjectMemberRequest request)
        {
            var userId = GetCurrentUserId();

            // Check if user has admin role
            var membership = await _context.ProjectMembers
                .FirstOrDefaultAsync(pm => pm.ProjectId == id && pm.UserId == userId && pm.IsActive);

            if (membership == null || membership.Role != "Admin")
                return Forbid("Only admins can add members to projects");

            // Find the user to add
            var userToAdd = await _context.Users
                .FirstOrDefaultAsync(u => u.Username == request.Username && u.IsActive);

            if (userToAdd == null)
                return BadRequest("User not found");

            // Check if user is already a member
            var existingMembership = await _context.ProjectMembers
                .FirstOrDefaultAsync(pm => pm.ProjectId == id && pm.UserId == userToAdd.Id);

            if (existingMembership != null)
            {
                if (existingMembership.IsActive)
                    return BadRequest("User is already a member of this project");

                // Reactivate membership
                existingMembership.IsActive = true;
                existingMembership.Role = request.Role;
                existingMembership.JoinedAt = DateTime.UtcNow;
            }
            else
            {
                // Create new membership
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

            // Check if user has admin role
            var userMembership = await _context.ProjectMembers
                .FirstOrDefaultAsync(pm => pm.ProjectId == id && pm.UserId == userId && pm.IsActive);

            if (userMembership == null || userMembership.Role != "Admin")
                return Forbid("Only admins can remove members from projects");

            var memberToRemove = await _context.ProjectMembers
                .FirstOrDefaultAsync(pm => pm.Id == memberId && pm.ProjectId == id);

            if (memberToRemove == null)
                return NotFound("Member not found");

            // Don't allow removing the project creator
            var project = await _context.Projects.FindAsync(id);
            if (project != null && memberToRemove.UserId == project.CreatedByUserId)
                return BadRequest("Cannot remove project creator");

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

            // Only project creator can delete the project
            if (project.CreatedByUserId != userId)
                return Forbid("Only the project creator can delete the project");

            _context.Projects.Remove(project);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}