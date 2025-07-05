using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using syncroAPI.Data;
using syncroAPI.Models;
using syncroAPI.Models.DTOs;
using syncroAPI.Services;

namespace syncroAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class FileController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IFileService _fileService;

        public FileController(ApplicationDbContext context, IFileService fileService)
        {
            _context = context;
            _fileService = fileService;
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.Parse(userIdClaim ?? "0");
        }

        private async Task<bool> HasTaskAccess(int taskId, int userId)
        {
            var task = await _context.Tasks
                .Include(t => t.Project)
                    .ThenInclude(p => p.ProjectMembers)
                .FirstOrDefaultAsync(t => t.Id == taskId);

            return task?.Project.ProjectMembers.Any(pm => pm.UserId == userId && pm.IsActive) ?? false;
        }

        [HttpPost("upload/{taskId}")]
        [ApiExplorerSettings(IgnoreApi = true)] // INCOMPATIBILITY? SOME ISSUE WITH THIS IDK
        public async Task<ActionResult<TaskAttachmentResponse>> UploadFile(int taskId, [FromForm] IFormFile file)
        {
            var userId = GetCurrentUserId();

            // Check if user has access to the task
            if (!await HasTaskAccess(taskId, userId))
                return Forbid("You don't have access to this task");

            var task = await _context.Tasks.FindAsync(taskId);
            if (task == null)
                return NotFound("Task not found");

            // Upload file
            var uploadResult = await _fileService.UploadFileAsync(file, "task-attachments");
            if (!uploadResult.Success)
                return BadRequest(uploadResult.ErrorMessage);

            // Create attachment record
            var attachment = new TaskAttachment
            {
                TaskId = taskId,
                UploadedByUserId = userId,
                FileName = file.FileName,
                FilePath = uploadResult.FilePath,
                ContentType = file.ContentType,
                FileSize = file.Length
            };

            _context.TaskAttachments.Add(attachment);
            await _context.SaveChangesAsync();

            // Get user for response
            var user = await _context.Users.FindAsync(userId);
            var response = new TaskAttachmentResponse
            {
                Id = attachment.Id,
                FileName = attachment.FileName,
                ContentType = attachment.ContentType,
                FileSize = attachment.FileSize,
                UploadedAt = attachment.UploadedAt,
                UploadedBy = new UserSummaryResponse
                {
                    Id = user!.Id,
                    Username = user.Username,
                    Email = user.Email
                }
            };

            return Ok(response);
        }

        [HttpGet("download/{attachmentId}")]
        public async Task<IActionResult> DownloadFile(int attachmentId)
        {
            var userId = GetCurrentUserId();

            var attachment = await _context.TaskAttachments
                .Include(a => a.Task)
                    .ThenInclude(t => t.Project)
                        .ThenInclude(p => p.ProjectMembers)
                .FirstOrDefaultAsync(a => a.Id == attachmentId);

            if (attachment == null)
                return NotFound("Attachment not found");

            // Check if user has access to the task
            var hasAccess = attachment.Task.Project.ProjectMembers
                .Any(pm => pm.UserId == userId && pm.IsActive);

            if (!hasAccess)
                return Forbid("You don't have access to this file");

            // Get file content
            var fileResult = await _fileService.GetFileAsync(attachment.FilePath);
            if (!fileResult.Success)
                return NotFound("File not found on server");

            return File(fileResult.FileContent, fileResult.ContentType, attachment.FileName);
        }

        [HttpDelete("{attachmentId}")]
        public async Task<IActionResult> DeleteFile(int attachmentId)
        {
            var userId = GetCurrentUserId();

            var attachment = await _context.TaskAttachments
                .Include(a => a.Task)
                    .ThenInclude(t => t.Project)
                        .ThenInclude(p => p.ProjectMembers)
                .FirstOrDefaultAsync(a => a.Id == attachmentId);

            if (attachment == null)
                return NotFound("Attachment not found");

            // Check if user has access and permission (only uploader or project admin can delete)
            var userMembership = attachment.Task.Project.ProjectMembers
                .FirstOrDefault(pm => pm.UserId == userId && pm.IsActive);

            if (userMembership == null)
                return Forbid("You don't have access to this task");

            if (attachment.UploadedByUserId != userId && userMembership.Role != "Admin")
                return Forbid("You don't have permission to delete this file");

            // Delete file from storage
            await _fileService.DeleteFileAsync(attachment.FilePath);

            // Delete attachment record
            _context.TaskAttachments.Remove(attachment);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("task/{taskId}/attachments")]
        public async Task<ActionResult<IEnumerable<TaskAttachmentResponse>>> GetTaskAttachments(int taskId)
        {
            var userId = GetCurrentUserId();

            // Check if user has access to the task
            if (!await HasTaskAccess(taskId, userId))
                return Forbid("You don't have access to this task");

            var attachments = await _context.TaskAttachments
                .Include(a => a.UploadedBy)
                .Where(a => a.TaskId == taskId)
                .Select(a => new TaskAttachmentResponse
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
                })
                .OrderByDescending(a => a.UploadedAt)
                .ToListAsync();

            return Ok(attachments);
        }
    }
}