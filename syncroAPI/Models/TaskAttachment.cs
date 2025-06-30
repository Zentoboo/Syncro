using System.ComponentModel.DataAnnotations;

namespace syncroAPI.Models
{
    public class TaskAttachment
    {
        public int Id { get; set; }
        
        [Required]
        [MaxLength(255)]
        public string FileName { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(500)]
        public string FilePath { get; set; } = string.Empty;
        
        [MaxLength(100)]
        public string ContentType { get; set; } = string.Empty;
        
        public long FileSize { get; set; }
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
        
        // Foreign Keys
        public int TaskId { get; set; }
        public int UploadedByUserId { get; set; }
        
        // Navigation Properties
        public Models.Task Task { get; set; } = null!;
        public User UploadedBy { get; set; } = null!;
    }
}