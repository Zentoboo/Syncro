namespace syncroAPI.Models.DTOs
{
    public class NotificationResponse
    {
        public int Id { get; set; }
        public string Message { get; set; } = string.Empty;
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
        public int? RelatedTaskId { get; set; }
        public int? ProjectId { get; set; }
        public string TriggeredByUsername { get; set; } = string.Empty;
    }

    public class EmailNotificationRequest
    {
        public string? From { get; set; } // This was the missing property
        public string? To { get; set; }
        public string? Subject { get; set; }
        public string? Body { get; set; }
    }
}