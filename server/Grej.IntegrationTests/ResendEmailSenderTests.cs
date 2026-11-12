using System.Net;
using System.Text.Json;
using Grej.Application.Common;
using Grej.Infrastructure.Email;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

namespace Grej.IntegrationTests;

// A fake HttpMessageHandler stands in for Resend, so nothing leaves the machine.
public class ResendEmailSenderTests
{
    private static readonly EmailMessage Message = new("anna@example.com", "Orderbekräftelse GREJ-1", "<p>Hej</p>");

    [Fact]
    public async Task Send_PostsTheMessageWithTheKey()
    {
        var resend = new FakeResend(HttpStatusCode.OK);

        await Sender(resend, apiKey: "re_test").SendAsync(Message, CancellationToken.None);

        Assert.Equal("https://api.resend.com/emails", resend.Request?.RequestUri?.ToString());
        Assert.Equal("Bearer re_test", resend.Request?.Headers.Authorization?.ToString());
        using var body = JsonDocument.Parse(resend.Body!);
        Assert.Equal("GREJ <onboarding@resend.dev>", body.RootElement.GetProperty("from").GetString());
        Assert.Equal("anna@example.com", body.RootElement.GetProperty("to")[0].GetString());
        Assert.Equal("Orderbekräftelse GREJ-1", body.RootElement.GetProperty("subject").GetString());
        Assert.Equal("<p>Hej</p>", body.RootElement.GetProperty("html").GetString());
    }

    [Fact]
    public async Task Send_RefusedByResend_DoesNotThrow()
    {
        var resend = new FakeResend(HttpStatusCode.Forbidden);

        await Sender(resend, apiKey: "re_test").SendAsync(Message, CancellationToken.None);

        Assert.NotNull(resend.Request);
    }

    [Fact]
    public async Task Send_WithoutKey_SendsNothingAndDoesNotThrow()
    {
        var resend = new FakeResend(HttpStatusCode.OK);

        await Sender(resend, apiKey: null).SendAsync(Message, CancellationToken.None);

        Assert.Null(resend.Request);
    }

    private static ResendEmailSender Sender(FakeResend resend, string? apiKey)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Email:From"] = "GREJ <onboarding@resend.dev>",
                ["Resend:ApiKey"] = apiKey,
            })
            .Build();
        return new ResendEmailSender(new HttpClient(resend), configuration, NullLogger<ResendEmailSender>.Instance);
    }

    private class FakeResend(HttpStatusCode status) : HttpMessageHandler
    {
        public HttpRequestMessage? Request { get; private set; }
        public string? Body { get; private set; }

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Request = request;
            Body = await request.Content!.ReadAsStringAsync(cancellationToken);
            return new HttpResponseMessage(status) { Content = new StringContent("{}") };
        }
    }
}
