using System.ComponentModel.DataAnnotations;

namespace syncroAPI.Models
{
    public class TaskComment
    {
        public int Id { get; set; }
        
        [Required]
        [MaxLength(1000)]
        public string Content { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        
        // Foreign Keys
        public int TaskId { get; set; }
        public int UserId { get; set; }
        
        // Navigation Properties
        public Models.Task Task { get; set; } = null!;
        public User User { get; set; } = null!;
    }
}