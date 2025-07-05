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
}