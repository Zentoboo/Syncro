using System.ComponentModel.DataAnnotations;

namespace syncroAPI.Models.DTOs
{
    public class CreateProjectRequest
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;
        
        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;
        
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
    }

    public class UpdateProjectRequest
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;
        
        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;
        
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public bool IsArchived { get; set; }
    }

    public class ProjectResponse
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public bool IsArchived { get; set; }
        public UserSummaryResponse CreatedBy { get; set; } = null!;
        public List<ProjectMemberResponse> Members { get; set; } = new List<ProjectMemberResponse>();
        public int TaskCount { get; set; }
        public int CompletedTaskCount { get; set; }
    }

    public class ProjectSummaryResponse
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public bool IsArchived { get; set; }
        public int TaskCount { get; set; }
        public int CompletedTaskCount { get; set; }
        public string UserRole { get; set; } = string.Empty;
    }

    public class AddProjectMemberRequest
    {
        [Required]
        public string Username { get; set; } = string.Empty;
        
        [Required]
        public string Role { get; set; } = "Contributor"; // Admin, ProjectManager, Contributor
    }

    public class ProjectMemberResponse
    {
        public int Id { get; set; }
        public UserSummaryResponse User { get; set; } = null!;
        public string Role { get; set; } = string.Empty;
        public DateTime JoinedAt { get; set; }
        public bool IsActive { get; set; }
    }

    public class UserSummaryResponse
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
    }
}