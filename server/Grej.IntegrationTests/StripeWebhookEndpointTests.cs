using System.Net;
using System.Text;
using Grej.Application.Payments;
using Grej.Domain.Orders;
using Grej.Domain.Payments;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Stripe;

namespace Grej.IntegrationTests;

// Tests POST /api/webhooks/stripe through the real API and the real signature check,
// with a fake instead of the database. The tests sign their webhooks with a test
// secret, the same way Stripe signs real webhooks with the real secret.
public class StripeWebhookEndpointTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    private const string Secret = "whsec_test";
    private const string Reference = "cs_test_fake";

    // A new instance per test (like in CheckoutEndpointTests), so each test starts with a Pending payment.
    private readonly FakePaymentRepository payments = new(Reference);

    [Fact]
    public async Task Post_PaidSession_MarksPaymentAsPaid()
    {
        var response = await PostAsync(CheckoutCompleted(Reference), signedWith: Secret);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(PaymentStatus.Paid, payments.Payment.Status);
        Assert.True(payments.Saved);
    }

    [Fact]
    public async Task Post_WrongSignature_ReturnsBadRequestAndChangesNothing()
    {
        var response = await PostAsync(CheckoutCompleted(Reference), signedWith: "whsec_someone_else");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(PaymentStatus.Pending, payments.Payment.Status);
        Assert.False(payments.Saved);
    }

    [Fact]
    public async Task Post_UnknownSession_ReturnsOkAndChangesNothing()
    {
        var response = await PostAsync(CheckoutCompleted("cs_test_unknown"), signedWith: Secret);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(PaymentStatus.Pending, payments.Payment.Status);
        Assert.False(payments.Saved);
    }

    // The parts of a checkout.session.completed event that the API reads.
    private static string CheckoutCompleted(string sessionId) => $$"""
        {
          "id": "evt_test",
          "object": "event",
          "type": "checkout.session.completed",
          "data": {
            "object": { "id": "{{sessionId}}", "object": "checkout.session", "payment_status": "paid" }
          }
        }
        """;

    // Starts the API with the test secret and the fake, and sends a signed webhook.
    private async Task<HttpResponseMessage> PostAsync(string payload, string signedWith)
    {
        var client = factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(
                    new Dictionary<string, string?> { ["Stripe:WebhookSecret"] = Secret }));
                builder.ConfigureTestServices(services =>
                    services.AddScoped<IPaymentRepository>(_ => payments));
            })
            .CreateClient();

        var request = new HttpRequestMessage(HttpMethod.Post, "/api/webhooks/stripe")
        {
            Content = new StringContent(payload, Encoding.UTF8, "application/json"),
        };
        // Stripe's own helper for signing webhooks in tests.
        request.Headers.Add("Stripe-Signature", EventUtility.GenerateSignatureHeader(payload, signedWith));

        return await client.SendAsync(request);
    }

    // Holds one Pending payment instead of reading from the database.
    private class FakePaymentRepository : IPaymentRepository
    {
        public FakePaymentRepository(string reference)
        {
            // Payments are only created through an order (Order.AddPayment).
            var order = new Order();
            order.AddItem(productId: 1, title: "Skål", unitPrice: 450m, quantity: 1);
            order.AddPayment("Stripe", reference);
            Payment = order.Payment!;
        }

        public Payment Payment { get; }
        public bool Saved { get; private set; }

        public Task<Payment?> GetByReferenceAsync(string reference, CancellationToken cancellationToken) =>
            Task.FromResult(reference == Payment.ProviderReference ? Payment : null);

        public Task SaveChangesAsync(CancellationToken cancellationToken)
        {
            Saved = true;
            return Task.CompletedTask;
        }
    }
}
