using System.ComponentModel.DataAnnotations;

namespace syncroAPI.Models
{
    public class ProjectMember
    {
        public int Id { get; set; }
        
        // Foreign Keys
        public int ProjectId { get; set; }
        public int UserId { get; set; }
        
        [MaxLength(20)]
        public string Role { get; set; } = "Contributor"; // Admin, ProjectManager, Contributor
        
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
        public bool IsActive { get; set; } = true;
        
        // Navigation Properties
        public Project Project { get; set; } = null!;
        public User User { get; set; } = null!;
    }
}