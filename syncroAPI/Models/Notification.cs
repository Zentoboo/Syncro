using System.ComponentModel.DataAnnotations;

namespace syncroAPI.Models
{
    public class Notification
    {
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; } // The user who receives the notification

        [Required]
        [MaxLength(500)]
        public string Message { get; set; } = string.Empty;

        public bool IsRead { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Optional link to a task to make notifications clickable
        public int? RelatedTaskId { get; set; }

        // The user who triggered the notification
        public int TriggeredByUserId { get; set; }

        // Navigation Properties
        public User User { get; set; } = null!;
        public User TriggeredByUser { get; set; } = null!;
        public Task? RelatedTask { get; set; }
    }
}