using System.ComponentModel.DataAnnotations;

namespace syncroAPI.Models
{
    public class Project
    {
        public int Id { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;
        
        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;
        
        public DateTime StartDate { get; set; } = DateTime.UtcNow;
        public DateTime? EndDate { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool IsArchived { get; set; } = false;
        
        // Foreign Key
        public int CreatedByUserId { get; set; }
        
        // Navigation Properties
        public User CreatedBy { get; set; } = null!;
        public ICollection<ProjectMember> ProjectMembers { get; set; } = new List<ProjectMember>();
        public ICollection<Models.Task> Tasks { get; set; } = new List<Models.Task>();
    }
}