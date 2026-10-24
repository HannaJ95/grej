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
    public async Task Create_SeveralProducts_SavesOneRowPerProductWithDatabasePrices()
    {
        var client = CreateClient(
            new Product { Id = 1, Title = "Skål", Price = 450m, Stock = 1, IsActive = true },
            new Product { Id = 2, Title = "Tavla", Price = 1200.50m, Stock = 3, IsActive = true });

        // A manipulated browser that sends its own prices. CheckoutRequest has no
        // price field, so the JSON reader skips them.
        var response = await client.PostAsJsonAsync("/api/checkout", new
        {
            items = new[]
            {
                new { productId = 1, quantity = 1, price = 1m },
                new { productId = 2, quantity = 2, price = 1m },
            },
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var order = Assert.Single(orders.Saved);
        Assert.Equal(["Skål", "Tavla"], order.Items.Select(item => item.TitleAtPurchase));
        Assert.Equal([450m, 1200.50m], order.Items.Select(item => item.UnitPrice));
        Assert.Equal([1, 2], order.Items.Select(item => item.Quantity));
        Assert.Equal(2851m, order.Total);
    }

    [Fact]
    public async Task Create_OneOfSeveralProductsHidden_ReturnsConflictAndSavesNothing()
    {
        var client = CreateClient(
            new Product { Id = 1, Title = "Skål", Price = 450m, Stock = 1, IsActive = true },
            new Product { Id = 2, Title = "Utkast", Price = 300m, Stock = 1, IsActive = false });

        var response = await client.PostAsJsonAsync("/api/checkout", new CheckoutRequest([new(1, 1), new(2, 1)]));

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

    [Fact]
    public async Task Create_SameProductTwice_ReturnsBadRequest()
    {
        var client = CreateClient(new Product { Id = 1, Title = "Skål", Price = 450m, Stock = 1, IsActive = true });

        var response = await client.PostAsJsonAsync("/api/checkout", new CheckoutRequest([new(1, 1), new(1, 1)]));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Empty(orders.Saved);
    }

    [Fact]
    public async Task Create_MoreThan100Rows_ReturnsBadRequest()
    {
        var client = CreateClient();
        var items = Enumerable.Range(1, 101).Select(id => new CheckoutItemRequest(id, 1)).ToList();

        var response = await client.PostAsJsonAsync("/api/checkout", new CheckoutRequest(items));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Create_NullRow_ReturnsBadRequest()
    {
        var client = CreateClient();

        // Sends {"items":[null]}. The ! tells the compiler that the null is on purpose.
        var response = await client.PostAsJsonAsync("/api/checkout", new CheckoutRequest([null!]));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
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
        // Checkout fetches all its products at once, with GetByIdsAsync.
        public Task<Product?> GetByIdAsync(int id, CancellationToken cancellationToken) =>
            throw new NotImplementedException();

        public Task<IReadOnlyList<Product>> GetByIdsAsync(IReadOnlyCollection<int> ids, CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<Product>>(products.Where(p => ids.Contains(p.Id)).ToList());

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
