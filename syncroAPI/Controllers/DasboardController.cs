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
    public class DashboardController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DashboardController(ApplicationDbContext context)
        {
            _context = context;
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.Parse(userIdClaim ?? "0");
        }

        [HttpGet("personal")]
        public async Task<ActionResult<PersonalDashboardResponse>> GetPersonalDashboard()
        {
            var userId = GetCurrentUserId();

            // Get user's projects
            var userProjects = await _context.ProjectMembers
                .Where(pm => pm.UserId == userId && pm.IsActive)
                .Select(pm => pm.ProjectId)
                .ToListAsync();

            // Get tasks assigned to user
            var assignedTasks = await _context.Tasks
                .Include(t => t.Project)
                .Where(t => t.AssignedToUserId == userId && userProjects.Contains(t.ProjectId))
                .ToListAsync();

            // Calculate upcoming and overdue tasks
            var now = DateTime.UtcNow;
            var upcomingTasks = assignedTasks
                .Where(t => t.Status != Models.TaskStatus.Done && t.DueDate.HasValue && t.DueDate.Value > now && t.DueDate.Value <= now.AddDays(7))
                .Select(t => new TaskSummaryResponse
                {
                    Id = t.Id,
                    Title = t.Title,
                    Status = t.Status,
                    Priority = t.Priority,
                    DueDate = t.DueDate,
                    ProjectName = t.Project.Name
                })
                .OrderBy(t => t.DueDate)
                .Take(10)
                .ToList();

            var overdueTasks = assignedTasks
                .Where(t => t.Status != Models.TaskStatus.Done && t.DueDate.HasValue && t.DueDate.Value < now)
                .Select(t => new TaskSummaryResponse
                {
                    Id = t.Id,
                    Title = t.Title,
                    Status = t.Status,
                    Priority = t.Priority,
                    DueDate = t.DueDate,
                    ProjectName = t.Project.Name
                })
                .OrderBy(t => t.DueDate)
                .Take(10)
                .ToList();

            // Task statistics
            var taskStats = new TaskStatistics
            {
                TotalTasks = assignedTasks.Count,
                CompletedTasks = assignedTasks.Count(t => t.Status == Models.TaskStatus.Done),
                InProgressTasks = assignedTasks.Count(t => t.Status == Models.TaskStatus.InProgress),
                TodoTasks = assignedTasks.Count(t => t.Status == Models.TaskStatus.ToDo),
                OverdueTasks = overdueTasks.Count,
                UpcomingTasks = upcomingTasks.Count
            };

            // Priority distribution
            var priorityDistribution = new List<PriorityDistribution>
            {
                new() { Priority = TaskPriority.Low, Count = assignedTasks.Count(t => t.Priority == TaskPriority.Low && t.Status != Models.TaskStatus.Done) },
                new() { Priority = TaskPriority.Medium, Count = assignedTasks.Count(t => t.Priority == TaskPriority.Medium && t.Status != Models.TaskStatus.Done) },
                new() { Priority = TaskPriority.High, Count = assignedTasks.Count(t => t.Priority == TaskPriority.High && t.Status != Models.TaskStatus.Done) },
                new() { Priority = TaskPriority.Critical, Count = assignedTasks.Count(t => t.Priority == TaskPriority.Critical && t.Status != Models.TaskStatus.Done) }
            };

            var response = new PersonalDashboardResponse
            {
                UpcomingTasks = upcomingTasks,
                OverdueTasks = overdueTasks,
                TaskStatistics = taskStats,
                PriorityDistribution = priorityDistribution
            };

            return Ok(response);
        }

        [HttpGet("project/{projectId}")]
        public async Task<ActionResult<ProjectDashboardResponse>> GetProjectDashboard(int projectId)
        {
            var userId = GetCurrentUserId();

            // Check project access
            var membership = await _context.ProjectMembers
                .FirstOrDefaultAsync(pm => pm.ProjectId == projectId && pm.UserId == userId && pm.IsActive);

            if (membership == null)
                return Forbid("You don't have access to this project");

            var project = await _context.Projects
                .Include(p => p.Tasks)
                    .ThenInclude(t => t.AssignedTo)
                .Include(p => p.ProjectMembers.Where(pm => pm.IsActive))
                    .ThenInclude(pm => pm.User)
                .FirstOrDefaultAsync(p => p.Id == projectId);

            if (project == null)
                return NotFound("Project not found");

            // Task distribution by status
            var tasksByStatus = new List<TaskStatusDistribution>
            {
                new() { Status = Models.TaskStatus.ToDo, Count = project.Tasks.Count(t => t.Status == Models.TaskStatus.ToDo) },
                new() { Status = Models.TaskStatus.InProgress, Count = project.Tasks.Count(t => t.Status == Models.TaskStatus.InProgress) },
                new() { Status = Models.TaskStatus.Done, Count = project.Tasks.Count(t => t.Status == Models.TaskStatus.Done) }
            };

            // Task distribution by team member
            var tasksByMember = project.ProjectMembers
                .Select(pm => new TaskMemberDistribution
                {
                    User = new UserSummaryResponse
                    {
                        Id = pm.User.Id,
                        Username = pm.User.Username,
                        Email = pm.User.Email
                    },
                    TotalTasks = project.Tasks.Count(t => t.AssignedToUserId == pm.UserId),
                    CompletedTasks = project.Tasks.Count(t => t.AssignedToUserId == pm.UserId && t.Status == Models.TaskStatus.Done),
                    InProgressTasks = project.Tasks.Count(t => t.AssignedToUserId == pm.UserId && t.Status == Models.TaskStatus.InProgress),
                    TodoTasks = project.Tasks.Count(t => t.AssignedToUserId == pm.UserId && t.Status == Models.TaskStatus.ToDo)
                })
                .ToList();

            // Recent activity (last 10 tasks created or updated)
            var recentActivity = project.Tasks
                .OrderByDescending(t => t.UpdatedAt)
                .Take(10)
                .Select(t => new TaskSummaryResponse
                {
                    Id = t.Id,
                    Title = t.Title,
                    Status = t.Status,
                    Priority = t.Priority,
                    DueDate = t.DueDate,
                    AssignedTo = t.AssignedTo != null ? new UserSummaryResponse
                    {
                        Id = t.AssignedTo.Id,
                        Username = t.AssignedTo.Username,
                        Email = t.AssignedTo.Email
                    } : null
                })
                .ToList();

            // Calculate project progress
            var totalTasks = project.Tasks.Count;
            var completedTasks = project.Tasks.Count(t => t.Status == Models.TaskStatus.Done);
            var progressPercentage = totalTasks > 0 ? (double)completedTasks / totalTasks * 100 : 0;

            var response = new ProjectDashboardResponse
            {
                ProjectId = projectId,
                ProjectName = project.Name,
                TotalTasks = totalTasks,
                CompletedTasks = completedTasks,
                ProgressPercentage = Math.Round(progressPercentage, 2),
                TasksByStatus = tasksByStatus,
                TasksByMember = tasksByMember,
                RecentActivity = recentActivity
            };

            return Ok(response);
        }

        [HttpGet("overview")]
        public async Task<ActionResult<OverviewDashboardResponse>> GetOverviewDashboard()
        {
            var userId = GetCurrentUserId();

            // Get user's projects
            var userProjects = await _context.ProjectMembers
                .Where(pm => pm.UserId == userId && pm.IsActive)
                .Include(pm => pm.Project)
                    .ThenInclude(p => p.Tasks)
                .ToListAsync();

            var projectSummaries = userProjects.Select(pm => new ProjectSummaryResponse
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
            }).ToList();

            // Overall statistics
            var allTasks = userProjects.SelectMany(pm => pm.Project.Tasks).ToList();
            var overallStats = new OverallStatistics
            {
                TotalProjects = userProjects.Count,
                ActiveProjects = userProjects.Count(pm => !pm.Project.IsArchived),
                TotalTasks = allTasks.Count,
                CompletedTasks = allTasks.Count(t => t.Status == Models.TaskStatus.Done),
                OverdueTasks = allTasks.Count(t => t.Status != Models.TaskStatus.Done && 
                                                 t.DueDate.HasValue && 
                                                 t.DueDate.Value < DateTime.UtcNow),
                TasksAssignedToUser = allTasks.Count(t => t.AssignedToUserId == userId)
            };

            var response = new OverviewDashboardResponse
            {
                Projects = projectSummaries,
                OverallStatistics = overallStats
            };

            return Ok(response);
        }
    }

    // Dashboard DTOs
    public class PersonalDashboardResponse
    {
        public List<TaskSummaryResponse> UpcomingTasks { get; set; } = new();
        public List<TaskSummaryResponse> OverdueTasks { get; set; } = new();
        public TaskStatistics TaskStatistics { get; set; } = new();
        public List<PriorityDistribution> PriorityDistribution { get; set; } = new();
    }

    public class ProjectDashboardResponse
    {
        public int ProjectId { get; set; }
        public string ProjectName { get; set; } = string.Empty;
        public int TotalTasks { get; set; }
        public int CompletedTasks { get; set; }
        public double ProgressPercentage { get; set; }
        public List<TaskStatusDistribution> TasksByStatus { get; set; } = new();
        public List<TaskMemberDistribution> TasksByMember { get; set; } = new();
        public List<TaskSummaryResponse> RecentActivity { get; set; } = new();
    }

    public class OverviewDashboardResponse
    {
        public List<ProjectSummaryResponse> Projects { get; set; } = new();
        public OverallStatistics OverallStatistics { get; set; } = new();
    }

    public class TaskStatistics
    {
        public int TotalTasks { get; set; }
        public int CompletedTasks { get; set; }
        public int InProgressTasks { get; set; }
        public int TodoTasks { get; set; }
        public int OverdueTasks { get; set; }
        public int UpcomingTasks { get; set; }
    }

    public class PriorityDistribution
    {
        public TaskPriority Priority { get; set; }
        public int Count { get; set; }
    }

    public class TaskStatusDistribution
    {
        public Models.TaskStatus Status { get; set; }
        public int Count { get; set; }
    }

    public class TaskMemberDistribution
    {
        public UserSummaryResponse User { get; set; } = new();
        public int TotalTasks { get; set; }
        public int CompletedTasks { get; set; }
        public int InProgressTasks { get; set; }
        public int TodoTasks { get; set; }
    }

    public class OverallStatistics
    {
        public int TotalProjects { get; set; }
        public int ActiveProjects { get; set; }
        public int TotalTasks { get; set; }
        public int CompletedTasks { get; set; }
        public int OverdueTasks { get; set; }
        public int TasksAssignedToUser { get; set; }
    }
}