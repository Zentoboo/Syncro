using System.ComponentModel.DataAnnotations;

namespace syncroAPI.Models.DTOs
{
    public class CreateTaskRequest
    {
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;
        
        [MaxLength(1000)]
        public string Description { get; set; } = string.Empty;
        
        [Required]
        public int ProjectId { get; set; }
        
        public int? AssignedToUserId { get; set; }
        public int? ParentTaskId { get; set; }
        public TaskPriority Priority { get; set; } = TaskPriority.Medium;
        public DateTime? DueDate { get; set; }
    }

    public class UpdateTaskRequest
    {
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;
        
        [MaxLength(1000)]
        public string Description { get; set; } = string.Empty;
        
        public int? AssignedToUserId { get; set; }
        public TaskStatus Status { get; set; }
        public TaskPriority Priority { get; set; }
        public DateTime? DueDate { get; set; }
    }

    public class TaskResponse
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public TaskStatus Status { get; set; }
        public TaskPriority Priority { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public DateTime? DueDate { get; set; }
        
        public ProjectSummaryResponse Project { get; set; } = null!;
        public UserSummaryResponse CreatedBy { get; set; } = null!;
        public UserSummaryResponse? AssignedTo { get; set; }
        public TaskSummaryResponse? ParentTask { get; set; }
        
        public List<TaskSummaryResponse> SubTasks { get; set; } = new List<TaskSummaryResponse>();
        public List<TaskCommentResponse> Comments { get; set; } = new List<TaskCommentResponse>();
        public List<TaskAttachmentResponse> Attachments { get; set; } = new List<TaskAttachmentResponse>();
    }

    public class TaskSummaryResponse
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public TaskStatus Status { get; set; }
        public TaskPriority Priority { get; set; }
        public DateTime? DueDate { get; set; }
        public UserSummaryResponse? AssignedTo { get; set; }
        public string ProjectName { get; set; } = string.Empty;
        public int SubTaskCount { get; set; }
        public int CompletedSubTaskCount { get; set; }
    }

    public class CreateTaskCommentRequest
    {
        [Required]
        [MaxLength(1000)]
        public string Content { get; set; } = string.Empty;
    }

    public class TaskCommentResponse
    {
        public int Id { get; set; }
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public UserSummaryResponse User { get; set; } = null!;
    }

    public class TaskAttachmentResponse
    {
        public int Id { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public DateTime UploadedAt { get; set; }
        public UserSummaryResponse UploadedBy { get; set; } = null!;
    }
}