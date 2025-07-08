using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace syncroAPI.Services
{
    public class DailyDigestService : IHostedService, IDisposable
    {
        private Timer _timer;
        private readonly IServiceProvider _services;

        public DailyDigestService(IServiceProvider services)
        {
            _services = services;
        }

        public Task StartAsync(CancellationToken stoppingToken)
        {
            Console.WriteLine("Daily Digest Service is starting.");

            _timer = new Timer(DoWork, null, TimeSpan.Zero, TimeSpan.FromDays(1));

            return Task.CompletedTask;
        }

        private void DoWork(object state)
        {
            Console.WriteLine("Daily Digest Service is working.");

            using (var scope = _services.CreateScope())
            {
                var dailyDigestController = scope.ServiceProvider.GetRequiredService<Controllers.DailyDigestController>();
                dailyDigestController.SendDigests().Wait();
            }
        }

        public Task StopAsync(CancellationToken stoppingToken)
        {
            Console.WriteLine("Daily Digest Service is stopping.");

            _timer?.Change(Timeout.Infinite, 0);

            return Task.CompletedTask;
        }

        public void Dispose()
        {
            _timer?.Dispose();
        }
    }
}