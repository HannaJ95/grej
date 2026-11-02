using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Grej.Application.Common;
using Grej.Application.Identity;
using Grej.Application.Orders;
using Grej.Domain.Orders;
using Grej.Infrastructure.Identity;
using Grej.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Grej.IntegrationTests;

// Tests the CMS's order endpoints the same way as AdminCategoriesEndpointTests: the real
// API, repositories and admin login, with EF Core's in-memory database.
public class AdminOrdersEndpointTests : IClassFixture<WebApplicationFactory<Program>>
{
    private const string Email = "admin@example.com";
    private const string Password = "Test-password-1";

    private readonly WebApplicationFactory<Program> app;

    public AdminOrdersEndpointTests(WebApplicationFactory<Program> factory)
    {
        // A new empty in-memory database for each test.
        var databaseName = Guid.NewGuid().ToString();

        app = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["Admin:Email"] = Email,
                    ["Admin:Password"] = Password,
                    ["Jwt:SigningKey"] = "test-signing-key-that-is-at-least-32-bytes",
                }));
            builder.ConfigureTestServices(services =>
            {
                services.RemoveAll<IDbContextOptionsConfiguration<GrejDbContext>>();
                services.AddDbContext<GrejDbContext>(options => options.UseInMemoryDatabase(databaseName));
            });
        });
    }

    [Fact]
    public async Task GetPage_WithoutToken_ReturnsUnauthorized()
    {
        var response = await app.CreateClient().GetAsync("/api/admin/orders");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetPage_ByDefault_ReturnsPaidOrdersNotShippedOldestFirst()
    {
        // Saved in this order, so the first one is the oldest.
        var first = await AddOrderAsync(Pay);
        await AddOrderAsync();
        var third = await AddOrderAsync(Pay);
        await AddOrderAsync(Expire);
        var client = await CreateAdminClientAsync();

        var page = await client.GetFromJsonAsync<PagedResult<OrderSummaryDto>>("/api/admin/orders");

        Assert.Equal([first.Id, third.Id], page!.Items.Select(o => o.Id));
        Assert.Equal(2, page.TotalCount);
    }

    [Fact]
    public async Task GetPage_All_ReturnsEveryOrderNewestFirst()
    {
        var paid = await AddOrderAsync(Pay);
        var unpaid = await AddOrderAsync();
        var expired = await AddOrderAsync(Expire);
        var client = await CreateAdminClientAsync();

        var page = await client.GetFromJsonAsync<PagedResult<OrderSummaryDto>>("/api/admin/orders?all=true");

        Assert.Equal([expired.Id, unpaid.Id, paid.Id], page!.Items.Select(o => o.Id));
        // The statuses are sent as text, which the CMS turns into Swedish.
        Assert.Equal(["Expired", "Pending", "Paid"], page.Items.Select(o => o.PaymentStatus));
        Assert.Equal(["Cancelled", "Pending", "Pending"], page.Items.Select(o => o.Status));
    }

    [Fact]
    public async Task GetById_ReturnsCustomerRowsAndPaymentStatus()
    {
        var order = await AddOrderAsync(o =>
        {
            Pay(o);
            o.SetCustomerDetails(new CustomerDetails(
                "Anna Svensson", "anna@example.com", "Storgatan 1", null, "123 45", "Stockholm", "SE"));
        });
        var client = await CreateAdminClientAsync();

        var details = await client.GetFromJsonAsync<OrderDetailsDto>($"/api/admin/orders/{order.Id}");

        Assert.Equal(order.OrderNumber, details!.OrderNumber);
        Assert.Equal("Paid", details.PaymentStatus);
        Assert.Equal("Anna Svensson", details.CustomerName);
        Assert.Equal("Stockholm", details.City);
        var item = Assert.Single(details.Items);
        // 2 × 450 kr, calculated by the API.
        Assert.Equal(("Skål", 2, 900m), (item.Title, item.Quantity, item.LineTotal));
    }

    [Fact]
    public async Task GetById_UnknownId_ReturnsNotFound()
    {
        var client = await CreateAdminClientAsync();

        var response = await client.GetAsync("/api/admin/orders/999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // What the webhook does when a Checkout session is paid or expires (OrderService).
    private static void Pay(Order order) => order.Payment!.MarkAsPaid();

    private static void Expire(Order order)
    {
        order.Payment!.MarkAsExpired();
        order.Cancel();
    }

    // Saves an order with one row and a payment, like the checkout does. handle can pay or
    // expire it first. Its own scope = its own DbContext, like a separate request.
    private async Task<Order> AddOrderAsync(Action<Order>? handle = null)
    {
        var order = new Order();
        order.AddItem(productId: 1, title: "Skål", unitPrice: 450m, quantity: 2);
        order.AddPayment("Stripe", $"cs_test_{Guid.NewGuid():N}");
        handle?.Invoke(order);

        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<GrejDbContext>();
        db.Orders.Add(order);
        await db.SaveChangesAsync();
        return order;
    }

    // Logs in the way the frontend does, and sends the token with every request.
    private async Task<HttpClient> CreateAdminClientAsync()
    {
        await AdminSeeder.SeedAsync(app.Services);
        var client = app.CreateClient();
        var login = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(Email, Password));
        var token = (await login.Content.ReadFromJsonAsync<LoginResult>())!.Token;
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }
}
