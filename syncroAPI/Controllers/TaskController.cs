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
    public class TaskController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public TaskController(ApplicationDbContext context)
        {
            _context = context;
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.Parse(userIdClaim ?? "0");
        }

        private async Task<(bool hasAccess, string role)> HasProjectAccess(int projectId, int userId)
        {
            var membership = await _context.ProjectMembers
                .FirstOrDefaultAsync(pm => pm.ProjectId == projectId && pm.UserId == userId && pm.IsActive);
            
            return (membership != null, membership?.Role ?? "");
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<TaskSummaryResponse>>> GetTasks(
            [FromQuery] int? projectId = null,
            [FromQuery] Models.TaskStatus? status = null,
            [FromQuery] bool assignedToMe = false)
        {
            var userId = GetCurrentUserId();

            var query = _context.Tasks
                .Include(t => t.Project)
                .Include(t => t.AssignedTo)
                .Include(t => t.SubTasks)
                .Where(t => _context.ProjectMembers
                    .Any(pm => pm.ProjectId == t.ProjectId && pm.UserId == userId && pm.IsActive));

            if (projectId.HasValue)
                query = query.Where(t => t.ProjectId == projectId.Value);

            if (status.HasValue)
                query = query.Where(t => t.Status == status.Value);

            if (assignedToMe)
                query = query.Where(t => t.AssignedToUserId == userId);

            var tasks = await query
                .Where(t => t.ParentTaskId == null) // Only main tasks, not subtasks
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
                    } : null,
                    ProjectName = t.Project.Name,
                    SubTaskCount = t.SubTasks.Count,
                    CompletedSubTaskCount = t.SubTasks.Count(st => st.Status == Models.TaskStatus.Done)
                })
                .OrderByDescending(t => t.Priority)
                .ThenBy(t => t.DueDate)
                .ToListAsync();

            return Ok(tasks);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<TaskResponse>> GetTask(int id)
        {
            var userId = GetCurrentUserId();

            var task = await _context.Tasks
                .Include(t => t.Project)
                .Include(t => t.CreatedBy)
                .Include(t => t.AssignedTo)
                .Include(t => t.ParentTask)
                .Include(t => t.SubTasks)
                    .ThenInclude(st => st.AssignedTo)
                .Include(t => t.Comments)
                    .ThenInclude(c => c.User)
                .Include(t => t.Attachments)
                    .ThenInclude(a => a.UploadedBy)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (task == null)
                return NotFound("Task not found");

            // Check project access
            var (hasAccess, _) = await HasProjectAccess(task.ProjectId, userId);
            if (!hasAccess)
                return Forbid("You don't have access to this project");

            var response = new TaskResponse
            {
                Id = task.Id,
                Title = task.Title,
                Description = task.Description,
                Status = task.Status,
                Priority = task.Priority,
                CreatedAt = task.CreatedAt,
                UpdatedAt = task.UpdatedAt,
                DueDate = task.DueDate,
                Project = new ProjectSummaryResponse
                {
                    Id = task.Project.Id,
                    Name = task.Project.Name,
                    Description = task.Project.Description
                },
                CreatedBy = new UserSummaryResponse
                {
                    Id = task.CreatedBy.Id,
                    Username = task.CreatedBy.Username,
                    Email = task.CreatedBy.Email
                },
                AssignedTo = task.AssignedTo != null ? new UserSummaryResponse
                {
                    Id = task.AssignedTo.Id,
                    Username = task.AssignedTo.Username,
                    Email = task.AssignedTo.Email
                } : null,
                ParentTask = task.ParentTask != null ? new TaskSummaryResponse
                {
                    Id = task.ParentTask.Id,
                    Title = task.ParentTask.Title,
                    Status = task.ParentTask.Status,
                    Priority = task.ParentTask.Priority
                } : null,
                SubTasks = task.SubTasks.Select(st => new TaskSummaryResponse
                {
                    Id = st.Id,
                    Title = st.Title,
                    Status = st.Status,
                    Priority = st.Priority,
                    DueDate = st.DueDate,
                    AssignedTo = st.AssignedTo != null ? new UserSummaryResponse
                    {
                        Id = st.AssignedTo.Id,
                        Username = st.AssignedTo.Username,
                        Email = st.AssignedTo.Email
                    } : null
                }).ToList(),
                Comments = task.Comments
                    .OrderBy(c => c.CreatedAt)
                    .Select(c => new TaskCommentResponse
                    {
                        Id = c.Id,
                        Content = c.Content,
                        CreatedAt = c.CreatedAt,
                        UpdatedAt = c.UpdatedAt,
                        User = new UserSummaryResponse
                        {
                            Id = c.User.Id,
                            Username = c.User.Username,
                            Email = c.User.Email
                        }
                    }).ToList(),
                Attachments = task.Attachments.Select(a => new TaskAttachmentResponse
                {
                    Id = a.Id,
                    FileName = a.FileName,
                    ContentType = a.ContentType,
                    FileSize = a.FileSize,
                    UploadedAt = a.UploadedAt,
                    UploadedBy = new UserSummaryResponse
                    {
                        Id = a.UploadedBy.Id,
                        Username = a.UploadedBy.Username,
                        Email = a.UploadedBy.Email
                    }
                }).ToList()
            };

            return Ok(response);
        }

        [HttpPost]
        public async Task<ActionResult<TaskResponse>> CreateTask([FromBody] CreateTaskRequest request)
        {
            var userId = GetCurrentUserId();

            // Check project access and role
            var (hasAccess, userRole) = await HasProjectAccess(request.ProjectId, userId);
            if (!hasAccess)
                return Forbid("You don't have access to this project.");

            // *** NEW: Only Admin or ProjectManager can create tasks ***
            if (userRole != "Admin" && userRole != "ProjectManager")
                return Forbid("You don't have permission to create tasks in this project.");

            // Validate assigned user is a project member
            if (request.AssignedToUserId.HasValue)
            {
                var (assignedUserAccess, _) = await HasProjectAccess(request.ProjectId, request.AssignedToUserId.Value);
                if (!assignedUserAccess)
                    return BadRequest("Assigned user is not a member of this project");
            }

            // Validate parent task belongs to same project
            if (request.ParentTaskId.HasValue)
            {
                var parentTask = await _context.Tasks
                    .FirstOrDefaultAsync(t => t.Id == request.ParentTaskId.Value);
                
                if (parentTask == null || parentTask.ProjectId != request.ProjectId)
                    return BadRequest("Invalid parent task");
            }

            var task = new Models.Task
            {
                Title = request.Title,
                Description = request.Description,
                ProjectId = request.ProjectId,
                CreatedByUserId = userId,
                AssignedToUserId = request.AssignedToUserId,
                ParentTaskId = request.ParentTaskId,
                Priority = request.Priority,
                DueDate = request.DueDate,
                Status = Models.TaskStatus.ToDo // Always start as ToDo
            };

            _context.Tasks.Add(task);
            await _context.SaveChangesAsync();

            // You might need to adjust GetTask to return the full response DTO
            var createdTask = await _context.Tasks.FindAsync(task.Id);
            return Ok(createdTask); 
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<TaskResponse>> UpdateTask(int id, [FromBody] UpdateTaskRequest request)
        {
            var userId = GetCurrentUserId();

            var task = await _context.Tasks
                .Include(t => t.Project)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (task == null)
                return NotFound("Task not found");

            var (hasAccess, userRole) = await HasProjectAccess(task.ProjectId, userId);
            if (!hasAccess)
                return Forbid("You don't have access to this project");

            // *** NEW: Workflow Logic for Status Changes ***
            var oldStatus = task.Status;
            var newStatus = request.Status;

            if (oldStatus != newStatus)
            {
                bool isManager = userRole == "Admin" || userRole == "ProjectManager";
                bool isAssignedUser = task.AssignedToUserId == userId;

                // Contributor: ToDo -> InProgress
                if (oldStatus == Models.TaskStatus.ToDo && newStatus == Models.TaskStatus.InProgress && isAssignedUser)
                {
                    task.Status = newStatus;
                }
                // Contributor: InProgress -> InReview
                else if (oldStatus == Models.TaskStatus.InProgress && newStatus == Models.TaskStatus.InReview && isAssignedUser)
                {
                    task.Status = newStatus;
                }
                // Manager: InReview -> Done (Approve)
                else if (oldStatus == Models.TaskStatus.InReview && newStatus == Models.TaskStatus.Done && isManager)
                {
                    task.Status = newStatus;
                }
                // Manager: InReview -> InProgress (Reject)
                else if (oldStatus == Models.TaskStatus.InReview && newStatus == Models.TaskStatus.InProgress && isManager)
                {
                    task.Status = newStatus;
                }
                else if (oldStatus != newStatus) // If any other status change is attempted
                {
                    return Forbid("You do not have permission to make this status change.");
                }
            }

            // Validate assigned user is a project member
            if (request.AssignedToUserId.HasValue)
            {
                var (assignedUserAccess, _) = await HasProjectAccess(task.ProjectId, request.AssignedToUserId.Value);
                if (!assignedUserAccess)
                    return BadRequest("Assigned user is not a member of this project");
            }
            
            // Update other details
            task.Title = request.Title;
            task.Description = request.Description;
            task.AssignedToUserId = request.AssignedToUserId;
            task.Priority = request.Priority;
            task.DueDate = request.DueDate;
            task.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            
            var updatedTask = await _context.Tasks.FindAsync(task.Id);
            return Ok(updatedTask);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTask(int id)
        {
            var userId = GetCurrentUserId();

            var task = await _context.Tasks.FindAsync(id);

            if (task == null)
                return NotFound("Task not found");

            var (hasAccess, userRole) = await HasProjectAccess(task.ProjectId, userId);
            if (!hasAccess)
                return Forbid("You don't have access to this project");

            // *** NEW: Only Admin or ProjectManager can delete tasks ***
            if (userRole != "Admin" && userRole != "ProjectManager")
                return Forbid("You don't have permission to delete this task.");

            _context.Tasks.Remove(task);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPost("{id}/comments")]
        public async Task<ActionResult<TaskCommentResponse>> AddComment(int id, [FromBody] CreateTaskCommentRequest request)
        {
            var userId = GetCurrentUserId();

            var task = await _context.Tasks
                .Include(t => t.Project)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (task == null)
                return NotFound("Task not found");

            // Check project access
            var (hasAccess, _) = await HasProjectAccess(task.ProjectId, userId);
            if (!hasAccess)
                return Forbid("You don't have access to this project");

            var comment = new TaskComment
            {
                TaskId = id,
                UserId = userId,
                Content = request.Content
            };

            _context.TaskComments.Add(comment);
            await _context.SaveChangesAsync();

            var user = await _context.Users.FindAsync(userId);
            var response = new TaskCommentResponse
            {
                Id = comment.Id,
                Content = comment.Content,
                CreatedAt = comment.CreatedAt,
                UpdatedAt = comment.UpdatedAt,
                User = new UserSummaryResponse
                {
                    Id = user!.Id,
                    Username = user.Username,
                    Email = user.Email
                }
            };

            return Ok(response);
        }

        [HttpGet("my-tasks")]
        public async Task<ActionResult<IEnumerable<TaskSummaryResponse>>> GetMyTasks()
        {
            var userId = GetCurrentUserId();

            var tasks = await _context.Tasks
                .Include(t => t.Project)
                .Include(t => t.AssignedTo)
                .Include(t => t.SubTasks)
                .Where(t => t.AssignedToUserId == userId && 
                           _context.ProjectMembers
                               .Any(pm => pm.ProjectId == t.ProjectId && pm.UserId == userId && pm.IsActive))
                .Select(t => new TaskSummaryResponse
                {
                    Id = t.Id,
                    Title = t.Title,
                    Status = t.Status,
                    Priority = t.Priority,
                    DueDate = t.DueDate,
                    AssignedTo = new UserSummaryResponse
                    {
                        Id = t.AssignedTo!.Id,
                        Username = t.AssignedTo.Username,
                        Email = t.AssignedTo.Email
                    },
                    ProjectName = t.Project.Name,
                    SubTaskCount = t.SubTasks.Count,
                    CompletedSubTaskCount = t.SubTasks.Count(st => st.Status == Models.TaskStatus.Done)
                })
                .OrderBy(t => t.DueDate)
                .ThenByDescending(t => t.Priority)
                .ToListAsync();

            return Ok(tasks);
        }
    }
}
