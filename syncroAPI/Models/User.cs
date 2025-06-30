namespace syncroAPI.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string Role { get; set; } = "User";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool IsActive { get; set; } = true;
        
        // Navigation Properties
        public ICollection<Project> CreatedProjects { get; set; } = new List<Project>();
        public ICollection<ProjectMember> ProjectMemberships { get; set; } = new List<ProjectMember>();
        public ICollection<Models.Task> CreatedTasks { get; set; } = new List<Models.Task>();
        public ICollection<Models.Task> AssignedTasks { get; set; } = new List<Models.Task>();
        public ICollection<TaskComment> TaskComments { get; set; } = new List<TaskComment>();
        public ICollection<TaskAttachment> UploadedAttachments { get; set; } = new List<TaskAttachment>();
    }
}