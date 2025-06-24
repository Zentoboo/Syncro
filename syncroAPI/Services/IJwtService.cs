using System.Security.Claims;
using syncroAPI.Models;

namespace syncroAPI.Services
{
    public interface IJwtService
    {
        string GenerateToken(User user);
        ClaimsPrincipal? ValidateToken(string token);
    }
}