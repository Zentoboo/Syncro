using Microsoft.Extensions.Configuration;
using MimeKit;
using MailKit.Net.Smtp;
using MailKit.Security;
using syncroAPI.Models.DTOs;
using System.Threading.Tasks;
using System;

namespace syncroAPI.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task<bool> SendEmailAsync(EmailNotificationRequest emailRequest)
        {
            var smtpSettings = _configuration.GetSection("SmtpSettings");
            var email = new MimeMessage();

            // Use the "From" address in the request, or fall back to the default in settings
            var fromAddress = !string.IsNullOrEmpty(emailRequest.From) 
                ? emailRequest.From 
                : smtpSettings["Username"];
            
            email.From.Add(MailboxAddress.Parse(fromAddress));
            email.To.Add(MailboxAddress.Parse(emailRequest.To));
            email.Subject = emailRequest.Subject;
            email.Body = new TextPart(MimeKit.Text.TextFormat.Html) { Text = emailRequest.Body };

            using var smtp = new SmtpClient();
            try
            {
                await smtp.ConnectAsync(smtpSettings["Server"], int.Parse(smtpSettings["Port"]), SecureSocketOptions.StartTls);
                // Authenticate with the primary account from settings
                await smtp.AuthenticateAsync(smtpSettings["Username"], smtpSettings["Password"]);
                await smtp.SendAsync(email);
                await smtp.DisconnectAsync(true);
                Console.WriteLine($"Email sent successfully from {fromAddress}!");
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to send email using MailKit: {ex.Message}");
                return false;
            }
        }
    }
}