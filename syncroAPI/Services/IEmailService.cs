using syncroAPI.Models.DTOs;

namespace syncroAPI.Services
{
    public interface IEmailService
    {
        Task<bool> SendEmailAsync(EmailNotificationRequest emailRequest);
    }
}