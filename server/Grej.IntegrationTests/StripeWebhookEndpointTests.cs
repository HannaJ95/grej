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

// The real API and signature check, with fakes instead of the database. The tests sign with a
// test secret, the way Stripe signs with the real one.
public class StripeWebhookEndpointTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    private const string Secret = "whsec_test";
    private const string Reference = "cs_test_fake";
    private const string PaymentIntent = "pi_test_fake";

    // New per test: a Pending payment for one item of a product with stock 1.
    private readonly Product product = new() { Id = 1, Title = "Skål", Price = 450m, Stock = 1, IsActive = true };
    private readonly FakePaymentRepository payments = new(Reference, productId: 1);

    [Fact]
    public async Task Post_PaidSession_MarksPaymentAsPaidAndDecreasesStock()
    {
        var response = await PostAsync(CheckoutCompleted(Reference), signedWith: Secret);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(PaymentStatus.Paid, payments.Payment.Status);
        Assert.Equal(0, product.Stock);
        Assert.False(payments.Order.IsOversold);
        Assert.True(payments.Saved);
    }

    [Fact]
    public async Task Post_PaidSessionAfterLastItemWasSold_MarksOrderAsOversold()
    {
        // Another customer paid for the last item first.
        product.Stock = 0;

        var response = await PostAsync(CheckoutCompleted(Reference), signedWith: Secret);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(-1, product.Stock);
        Assert.True(payments.Order.IsOversold);
        Assert.True(payments.Saved);
    }

    [Fact]
    public async Task Post_PaidSession_StoresCustomerDetailsOnOrder()
    {
        var response = await PostAsync(CheckoutCompleted(Reference), signedWith: Secret);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var order = payments.Order;
        Assert.Equal("Anna Andersson", order.CustomerName);
        Assert.Equal("anna@example.com", order.CustomerEmail);
        Assert.Equal("Storgatan 1", order.AddressLine1);
        Assert.Null(order.AddressLine2);
        Assert.Equal("111 22", order.PostalCode);
        Assert.Equal("Stockholm", order.City);
        Assert.Equal("SE", order.Country);
    }

    [Fact]
    public async Task Post_PaidSession_StoresPaymentIntentId()
    {
        await PostAsync(CheckoutCompleted(Reference), signedWith: Secret);

        Assert.Equal(PaymentIntent, payments.Payment.ProviderPaymentId);
    }

    [Fact]
    public async Task Post_PaidSessionWithoutAddress_MarksPaymentAsPaid()
    {
        var response = await PostAsync(CheckoutCompleted(Reference, withAddress: false), signedWith: Secret);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(PaymentStatus.Paid, payments.Payment.Status);
        Assert.Null(payments.Order.CustomerName);
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
    public async Task Post_ExpiredSession_ExpiresPaymentAndCancelsOrder()
    {
        var response = await PostAsync(CheckoutExpired(Reference), signedWith: Secret);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(PaymentStatus.Expired, payments.Payment.Status);
        Assert.Equal(OrderStatus.Cancelled, payments.Order.Status);
        Assert.Equal(1, product.Stock);
        Assert.True(payments.Saved);
    }

    [Fact]
    public async Task Post_RefundedCharge_RefundsPaymentAndKeepsOrderAndStock()
    {
        await PostAsync(CheckoutCompleted(Reference), signedWith: Secret);

        var response = await PostAsync(ChargeRefunded(PaymentIntent), signedWith: Secret);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(PaymentStatus.Refunded, payments.Payment.Status);
        // A refund never changes the order or the stock (constraints.md).
        Assert.Equal(OrderStatus.Pending, payments.Order.Status);
        Assert.Equal(0, product.Stock);
    }

    [Fact]
    public async Task Post_PartlyRefundedCharge_ChangesNothing()
    {
        await PostAsync(CheckoutCompleted(Reference), signedWith: Secret);

        var response = await PostAsync(ChargeRefunded(PaymentIntent, fully: false), signedWith: Secret);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(PaymentStatus.Paid, payments.Payment.Status);
    }

    [Fact]
    public async Task Post_PaidSession_RemembersEvent()
    {
        await PostAsync(CheckoutCompleted(Reference), signedWith: Secret);

        Assert.Contains("evt_test", payments.ProcessedEvents);
    }

    [Fact]
    public async Task Post_AlreadyProcessedEvent_ReturnsOkAndChangesNothing()
    {
        // As if an earlier request had handled it.
        payments.ProcessedEvents.Add("evt_test");

        var response = await PostAsync(CheckoutCompleted(Reference), signedWith: Secret);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(PaymentStatus.Pending, payments.Payment.Status);
        Assert.Equal(1, product.Stock);
        Assert.False(payments.Saved);
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

    // Only the parts of the events that the API reads. Sessions created before Checkout asked
    // for a shipping address have no collected_information.
    private static string CheckoutCompleted(string sessionId, bool withAddress = true) => $$"""
        {
          "id": "evt_test",
          "object": "event",
          "type": "checkout.session.completed",
          "data": {
            "object": {
              "id": "{{sessionId}}",
              "object": "checkout.session",
              "payment_status": "paid",
              "payment_intent": "{{PaymentIntent}}",
              "customer_details": { "email": "anna@example.com" },
              "collected_information": {{(withAddress ? CollectedInformation : "null")}}
            }
          }
        }
        """;

    private static string CheckoutExpired(string sessionId) => $$"""
        {
          "id": "evt_test_expired",
          "object": "event",
          "type": "checkout.session.expired",
          "data": {
            "object": {
              "id": "{{sessionId}}",
              "object": "checkout.session",
              "payment_status": "unpaid"
            }
          }
        }
        """;

    // "refunded" is false after a partial refund.
    private static string ChargeRefunded(string paymentIntentId, bool fully = true) => $$"""
        {
          "id": "evt_test_refunded",
          "object": "event",
          "type": "charge.refunded",
          "data": {
            "object": {
              "id": "ch_test_fake",
              "object": "charge",
              "payment_intent": "{{paymentIntentId}}",
              "refunded": {{(fully ? "true" : "false")}}
            }
          }
        }
        """;

    private const string CollectedInformation = """
        {
          "shipping_details": {
            "name": "Anna Andersson",
            "address": { "line1": "Storgatan 1", "line2": null, "postal_code": "111 22", "city": "Stockholm", "country": "SE" }
          }
        }
        """;

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
        // Like the ProcessedWebhookEvents table.
        public HashSet<string> ProcessedEvents { get; } = [];

        // Both of the payment's ids, like PaymentRepository.
        public Task<Payment?> GetByReferenceAsync(string reference, CancellationToken cancellationToken) =>
            Task.FromResult(reference == Payment.ProviderReference || reference == Payment.ProviderPaymentId ? Payment : null);

        public Task<bool> IsEventProcessedAsync(string eventId, CancellationToken cancellationToken) =>
            Task.FromResult(ProcessedEvents.Contains(eventId));

        public void AddProcessedEvent(string eventId) => ProcessedEvents.Add(eventId);

        public Task SaveChangesAsync(CancellationToken cancellationToken)
        {
            Saved = true;
            return Task.CompletedTask;
        }
    }

    // The order's Id and the payment's OrderId are both 0, since nothing is saved.
    private class FakeOrderRepository(Order order) : IOrderRepository
    {
        public Task<Order?> GetByIdAsync(int id, CancellationToken cancellationToken) =>
            Task.FromResult(id == order.Id ? order : null);

        // The webhook only reads the order, and PaymentRepository saves it.
        public Task AddAsync(Order order, CancellationToken cancellationToken) =>
            throw new NotImplementedException();

        public Task<PagedResult<Order>> GetPageAsync(
            bool all, IReadOnlyCollection<string> searchWords, int page, int pageSize, CancellationToken cancellationToken) =>
            throw new NotImplementedException();
        public Task<bool> ContainsProductAsync(int productId, CancellationToken cancellationToken) =>
            throw new NotImplementedException();
        public Task SaveChangesAsync(CancellationToken cancellationToken) =>
            throw new NotImplementedException();
    }

    private class FakeProductRepository(Product product) : IProductRepository
    {
        public Task<IReadOnlyList<Product>> GetByIdsAsync(IReadOnlyCollection<int> ids, CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<Product>>(ids.Contains(product.Id) ? [product] : []);

        // The webhook only uses GetByIdsAsync.
        public Task<Product?> GetByIdAsync(int id, CancellationToken cancellationToken) =>
            throw new NotImplementedException();

        public Task<PagedResult<Product>> GetActivePageAsync(
            int page, int pageSize, ProductFilter filter, CancellationToken cancellationToken) =>
            throw new NotImplementedException();

        public Task<decimal?> GetHighestActivePriceAsync(ProductFilter filter, CancellationToken cancellationToken) =>
            throw new NotImplementedException();

        public Task<IReadOnlyDictionary<int, int>> CountActiveByCategoryAsync(CancellationToken cancellationToken) =>
            throw new NotImplementedException();

        public Task<IReadOnlyDictionary<int, int>> CountByCategoryAsync(CancellationToken cancellationToken) =>
            throw new NotImplementedException();

        public Task<PagedResult<Product>> GetPageAsync(int page, int pageSize, CancellationToken cancellationToken) =>
            throw new NotImplementedException();
        public Task<bool> AnyInCategoryAsync(int categoryId, CancellationToken cancellationToken) =>
            throw new NotImplementedException();
        public void Add(Product product) => throw new NotImplementedException();
        public void Remove(Product product) => throw new NotImplementedException();
        public Task SaveChangesAsync(CancellationToken cancellationToken) => throw new NotImplementedException();
    }
}
