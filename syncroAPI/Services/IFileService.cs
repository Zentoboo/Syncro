namespace syncroAPI.Services
{
    public interface IFileService
    {
        Task<(bool Success, string FilePath, string ErrorMessage)> UploadFileAsync(IFormFile file, string folder);
        Task<bool> DeleteFileAsync(string filePath);
        Task<(bool Success, byte[] FileContent, string ContentType)> GetFileAsync(string filePath);
    }

    public class FileService : IFileService
    {
        private readonly IWebHostEnvironment _environment;
        private readonly IConfiguration _configuration;
        private readonly long _maxFileSize;
        private readonly string[] _allowedExtensions;

        public FileService(IWebHostEnvironment environment, IConfiguration configuration)
        {
            _environment = environment;
            _configuration = configuration;
            _maxFileSize = _configuration.GetValue<long>("FileUpload:MaxFileSize", 10485760); // 10MB default
            _allowedExtensions = _configuration.GetSection("FileUpload:AllowedExtensions").Get<string[]>() 
                ?? new[] { ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt", ".jpg", ".jpeg", ".png", ".gif" };
        }

        public async Task<(bool Success, string FilePath, string ErrorMessage)> UploadFileAsync(IFormFile file, string folder)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return (false, string.Empty, "No file provided");

                if (file.Length > _maxFileSize)
                    return (false, string.Empty, $"File size exceeds maximum allowed size of {_maxFileSize / 1024 / 1024}MB");

                var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (!_allowedExtensions.Contains(extension))
                    return (false, string.Empty, "File type not allowed");

                // Create upload directory if it doesn't exist
                var uploadsPath = Path.Combine(_environment.WebRootPath, "uploads", folder);
                Directory.CreateDirectory(uploadsPath);

                // Generate unique filename
                var fileName = $"{Guid.NewGuid()}{extension}";
                var filePath = Path.Combine(uploadsPath, fileName);

                // Save file
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // Return relative path for database storage
                var relativePath = Path.Combine("uploads", folder, fileName).Replace("\\", "/");
                return (true, relativePath, string.Empty);
            }
            catch (Exception ex)
            {
                return (false, string.Empty, $"Error uploading file: {ex.Message}");
            }
        }

        public Task<bool> DeleteFileAsync(string filePath)
        {
            try
            {
                var fullPath = Path.Combine(_environment.WebRootPath, filePath);
                if (File.Exists(fullPath))
                {
                    File.Delete(fullPath);
                    return Task.FromResult(true);
                }
                return Task.FromResult(false);
            }
            catch
            {
                return Task.FromResult(false);
            }
        }

        public async Task<(bool Success, byte[] FileContent, string ContentType)> GetFileAsync(string filePath)
        {
            try
            {
                var fullPath = Path.Combine(_environment.WebRootPath, filePath);
                if (!File.Exists(fullPath))
                    return (false, Array.Empty<byte>(), string.Empty);

                var fileContent = await File.ReadAllBytesAsync(fullPath);
                var contentType = GetContentType(filePath);
                
                return (true, fileContent, contentType);
            }
            catch
            {
                return (false, Array.Empty<byte>(), string.Empty);
            }
        }

        private string GetContentType(string filePath)
        {
            var extension = Path.GetExtension(filePath).ToLowerInvariant();
            return extension switch
            {
                ".pdf" => "application/pdf",
                ".doc" => "application/msword",
                ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ".xls" => "application/vnd.ms-excel",
                ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                ".txt" => "text/plain",
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".gif" => "image/gif",
                _ => "application/octet-stream"
            };
        }
    }
}