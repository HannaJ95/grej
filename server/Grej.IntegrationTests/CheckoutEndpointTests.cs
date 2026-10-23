using System.Net;
using System.Net.Http.Json;
using Grej.Application.Catalog;
using Grej.Application.Common;
using Grej.Application.Orders;
using Grej.Application.Payments;
using Grej.Domain.Catalog;
using Grej.Domain.Orders;
using Grej.Domain.Payments;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;

namespace Grej.IntegrationTests;

// Tests POST /api/checkout through the real API, but with fakes instead of the
// database and Stripe, so the tests need neither a database nor a Stripe key.
public class CheckoutEndpointTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    // xUnit creates a new instance of the class for each test, so each test
    // starts with an empty list of saved orders.
    private readonly FakeOrderRepository orders = new();

    [Fact]
    public async Task Create_ActiveProduct_SavesPendingOrderAndReturnsPaymentUrl()
    {
        var client = CreateClient(new Product { Id = 1, Title = "Skål", Price = 450m, Stock = 1, IsActive = true });

        var response = await client.PostAsJsonAsync("/api/checkout", Request(productId: 1, quantity: 2));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<CheckoutResponse>();
        Assert.Equal(FakePaymentProvider.Url, body?.Url);

        // The price comes from the product in the "database", not from the request.
        var order = Assert.Single(orders.Saved);
        Assert.Equal(900m, order.Total);
        Assert.NotNull(order.Payment);
        Assert.Equal(PaymentStatus.Pending, order.Payment.Status);
        Assert.Equal(FakePaymentProvider.Reference, order.Payment.ProviderReference);
    }

    [Fact]
    public async Task Create_SoldOutProduct_ReturnsConflictAndSavesNothing()
    {
        var client = CreateClient(new Product { Id = 1, Title = "Skål", Price = 450m, Stock = 0, IsActive = true });

        var response = await client.PostAsJsonAsync("/api/checkout", Request(productId: 1, quantity: 1));

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Empty(orders.Saved);
    }

    [Fact]
    public async Task Create_QuantityZero_ReturnsBadRequest()
    {
        var client = CreateClient(new Product { Id = 1, Title = "Skål", Price = 450m, Stock = 1, IsActive = true });

        var response = await client.PostAsJsonAsync("/api/checkout", Request(productId: 1, quantity: 0));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Empty(orders.Saved);
    }

    private static CheckoutRequest Request(int productId, int quantity) =>
        new([new CheckoutItemRequest(productId, quantity)]);

    // Starts the API with fakes instead of the database and Stripe.
    private HttpClient CreateClient(params Product[] products) =>
        factory.WithWebHostBuilder(builder => builder.ConfigureTestServices(services =>
            {
                services.AddScoped<IProductRepository>(_ => new FakeProductRepository(products));
                services.AddScoped<IOrderRepository>(_ => orders);
                services.AddScoped<IPaymentProvider, FakePaymentProvider>();
            }))
            .CreateClient();

    // The JSON that POST /api/checkout returns.
    private record CheckoutResponse(string Url);

    private class FakeProductRepository(Product[] products) : IProductRepository
    {
        public Task<Product?> GetByIdAsync(int id, CancellationToken cancellationToken) =>
            Task.FromResult(products.FirstOrDefault(p => p.Id == id));

        // Checkout never lists products.
        public Task<PagedResult<Product>> GetActivePageAsync(int page, int pageSize, CancellationToken cancellationToken) =>
            throw new NotImplementedException();
    }

    // Remembers saved orders instead of writing them to the database.
    private class FakeOrderRepository : IOrderRepository
    {
        public List<Order> Saved { get; } = [];

        public Task AddAsync(Order order, CancellationToken cancellationToken)
        {
            Saved.Add(order);
            return Task.CompletedTask;
        }
    }

    // Returns a fixed session instead of calling Stripe.
    private class FakePaymentProvider : IPaymentProvider
    {
        public const string Reference = "cs_test_fake";
        public const string Url = "https://checkout.stripe.test/cs_test_fake";

        public string Name => "Fake";

        public Task<CheckoutSession> CreateCheckoutSessionAsync(Order order, CancellationToken cancellationToken) =>
            Task.FromResult(new CheckoutSession(Reference, Url));
    }
}
