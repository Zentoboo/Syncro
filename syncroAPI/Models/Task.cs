using System.ComponentModel.DataAnnotations;

namespace syncroAPI.Models
{
    public enum TaskStatus
    {
        ToDo = 0,
        InProgress = 1,
        Done = 2
    }

    public enum TaskPriority
    {
        Low = 0,
        Medium = 1,
        High = 2,
        Critical = 3
    }

    public class Task
    {
        public int Id { get; set; }
        
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;
        
        [MaxLength(1000)]
        public string Description { get; set; } = string.Empty;
        
        public TaskStatus Status { get; set; } = TaskStatus.ToDo;
        public TaskPriority Priority { get; set; } = TaskPriority.Medium;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? DueDate { get; set; }
        
        // Foreign Keys
        public int ProjectId { get; set; }
        public int CreatedByUserId { get; set; }
        public int? AssignedToUserId { get; set; }
        public int? ParentTaskId { get; set; } // For subtasks
        
        // Navigation Properties
        public Project Project { get; set; } = null!;
        public User CreatedBy { get; set; } = null!;
        public User? AssignedTo { get; set; }
        public Task? ParentTask { get; set; }
        public ICollection<Task> SubTasks { get; set; } = new List<Task>();
        public ICollection<TaskComment> Comments { get; set; } = new List<TaskComment>();
        public ICollection<TaskAttachment> Attachments { get; set; } = new List<TaskAttachment>();
    }
}