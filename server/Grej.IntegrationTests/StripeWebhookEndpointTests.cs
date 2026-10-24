using System.Net;
using System.Text;
using Grej.Application.Catalog;
using Grej.Application.Common;
using Grej.Application.Orders;
using Grej.Application.Payments;
using Grej.Domain.Orders;
using Grej.Domain.Payments;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Stripe;
using Product = Grej.Domain.Catalog.Product;

namespace Grej.IntegrationTests;

// Tests POST /api/webhooks/stripe through the real API and the real signature check,
// with fakes instead of the database. The tests sign their webhooks with a test
// secret, the same way Stripe signs real webhooks with the real secret.
public class StripeWebhookEndpointTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    private const string Secret = "whsec_test";
    private const string Reference = "cs_test_fake";

    // New instances per test (like in CheckoutEndpointTests), so each test starts with
    // a Pending payment for an order of one item, of a product with stock 1.
    private readonly Product product = new() { Id = 1, Title = "Skål", Price = 450m, Stock = 1, IsActive = true };
    private readonly FakePaymentRepository payments = new(Reference, productId: 1);

    [Fact]
    public async Task Post_PaidSession_MarksPaymentAsPaidAndDecreasesStock()
    {
        var response = await PostAsync(CheckoutCompleted(Reference), signedWith: Secret);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(PaymentStatus.Paid, payments.Payment.Status);
        Assert.Equal(0, product.Stock);
        Assert.True(payments.Saved);
    }

    [Fact]
    public async Task Post_SameEventTwice_DecreasesStockOnce()
    {
        await PostAsync(CheckoutCompleted(Reference), signedWith: Secret);
        var response = await PostAsync(CheckoutCompleted(Reference), signedWith: Secret);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(PaymentStatus.Paid, payments.Payment.Status);
        Assert.Equal(0, product.Stock);
    }

    [Fact]
    public async Task Post_WrongSignature_ReturnsBadRequestAndChangesNothing()
    {
        var response = await PostAsync(CheckoutCompleted(Reference), signedWith: "whsec_someone_else");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(PaymentStatus.Pending, payments.Payment.Status);
        Assert.Equal(1, product.Stock);
        Assert.False(payments.Saved);
    }

    [Fact]
    public async Task Post_UnknownSession_ReturnsOkAndChangesNothing()
    {
        var response = await PostAsync(CheckoutCompleted("cs_test_unknown"), signedWith: Secret);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(PaymentStatus.Pending, payments.Payment.Status);
        Assert.Equal(1, product.Stock);
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

    // Starts the API with the test secret and the fakes, and sends a signed webhook.
    private async Task<HttpResponseMessage> PostAsync(string payload, string signedWith)
    {
        var client = factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(
                    new Dictionary<string, string?> { ["Stripe:WebhookSecret"] = Secret }));
                builder.ConfigureTestServices(services =>
                {
                    services.AddScoped<IPaymentRepository>(_ => payments);
                    services.AddScoped<IOrderRepository>(_ => new FakeOrderRepository(payments.Order));
                    services.AddScoped<IProductRepository>(_ => new FakeProductRepository(product));
                });
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
        public FakePaymentRepository(string reference, int productId)
        {
            // Payments are only created through an order (Order.AddPayment).
            Order = new Order();
            Order.AddItem(productId, title: "Skål", unitPrice: 450m, quantity: 1);
            Order.AddPayment("Stripe", reference);
            Payment = Order.Payment!;
        }

        public Order Order { get; }
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

    // Holds the payment's order. Its Id and the payment's OrderId are both 0,
    // since nothing is saved to a database in these tests.
    private class FakeOrderRepository(Order order) : IOrderRepository
    {
        public Task<Order?> GetByIdAsync(int id, CancellationToken cancellationToken) =>
            Task.FromResult(id == order.Id ? order : null);

        // The webhook never creates orders.
        public Task AddAsync(Order order, CancellationToken cancellationToken) =>
            throw new NotImplementedException();
    }

    // Holds the ordered product, so the tests can check its stock.
    private class FakeProductRepository(Product product) : IProductRepository
    {
        public Task<IReadOnlyList<Product>> GetByIdsAsync(IReadOnlyCollection<int> ids, CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<Product>>(ids.Contains(product.Id) ? [product] : []);

        // The webhook fetches all ordered products at once, with GetByIdsAsync.
        public Task<Product?> GetByIdAsync(int id, CancellationToken cancellationToken) =>
            throw new NotImplementedException();

        // The webhook never lists products.
        public Task<PagedResult<Product>> GetActivePageAsync(int page, int pageSize, CancellationToken cancellationToken) =>
            throw new NotImplementedException();
    }
}
