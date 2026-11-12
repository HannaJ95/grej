using System.Net.Http.Headers;
using System.Net.Http.Json;
using Grej.Application.Common;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Grej.Infrastructure.Email;

// Resend's REST API, since Render's free tier blocks SMTP.
public class ResendEmailSender(HttpClient http, IConfiguration configuration, ILogger<ResendEmailSender> logger)
    : IEmailSender
{
    public async Task SendAsync(EmailMessage message, CancellationToken cancellationToken)
    {
        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails")
            {
                Content = JsonContent.Create(new
                {
                    from = Setting("Email:From"),
                    to = new[] { message.To },
                    subject = message.Subject,
                    html = message.Html,
                }),
            };
            // Read here instead of at startup, so tests and CI work without it (like Supabase:SecretKey).
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", Setting("Resend:ApiKey"));

            using var response = await http.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                // E.g. 403 for any address but the account's own, since no domain is verified.
                var reason = await response.Content.ReadAsStringAsync(cancellationToken);
                logger.LogWarning("Resend refused \"{Subject}\": {Status} {Reason}",
                    message.Subject, (int)response.StatusCode, reason);
            }
        }
        catch (Exception exception)
        {
            // The order is already paid and saved, so a lost email must not fail the webhook.
            logger.LogWarning(exception, "Could not send \"{Subject}\".", message.Subject);
        }
    }

    private string Setting(string key) =>
        configuration[key] ?? throw new InvalidOperationException($"{key} is not configured.");
}
