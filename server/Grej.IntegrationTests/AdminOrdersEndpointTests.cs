using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Grej.Application.Common;
using Grej.Application.Identity;
using Grej.Application.Orders;
using Grej.Domain.Catalog;
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

// The real API, repositories and admin login, with EF Core's in-memory database.
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
        var toRefund = await AddOrderAsync(CancelPaid);
        var toCancel = await AddOrderAsync(Refund);
        await AddOrderAsync(CancelAndRefund);
        await AddOrderAsync(Ship);
        var client = await CreateAdminClientAsync();

        var page = await client.GetFromJsonAsync<PagedResult<OrderSummaryDto>>("/api/admin/orders");

        // The ones to ship, to refund and to cancel, but not the unpaid, expired, shipped
        // ones or the one that is both cancelled and refunded.
        Assert.Equal([first.Id, third.Id, toRefund.Id, toCancel.Id], page!.Items.Select(o => o.Id));
        Assert.Equal([false, false, true, false], page.Items.Select(o => o.NeedsRefund));
        Assert.Equal([false, false, false, true], page.Items.Select(o => o.NeedsCancelling));
        Assert.Equal(4, page.TotalCount);
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
        // As text, not as numbers.
        Assert.Equal(["Expired", "Pending", "Paid"], page.Items.Select(o => o.PaymentStatus));
        Assert.Equal(["Cancelled", "Pending", "Pending"], page.Items.Select(o => o.Status));
    }

    [Fact]
    public async Task GetPage_Search_FindsNumberNameEmailOrProduct_IgnoringCase()
    {
        var anna = await AddOrderAsync(PaidBy("Anna Svensson", "anna@example.com"));
        var erik = await AddOrderAsync(PaidBy("Erik Berg", "erik@grej.se"));
        var pot = await AddOrderAsync(Pay, title: "Kruka i lera");
        var client = await CreateAdminClientAsync();

        // The number without "GREJ-", in lower case.
        Assert.Equal([erik.Id], await SearchAsync(client, erik.OrderNumber[5..].ToLowerInvariant()));
        Assert.Equal([anna.Id], await SearchAsync(client, "ANNA"));
        Assert.Equal([erik.Id], await SearchAsync(client, "grej.se"));
        Assert.Equal([pot.Id], await SearchAsync(client, "kruka"));
    }

    [Fact]
    public async Task GetPage_Search_EveryWordMustMatch()
    {
        var annasPot = await AddOrderAsync(PaidBy("Anna Svensson", "anna@example.com"), title: "Kruka");
        await AddOrderAsync(PaidBy("Anna Svensson", "anna@example.com"));
        await AddOrderAsync(Pay, title: "Kruka");
        var client = await CreateAdminClientAsync();

        // One word in the name and one in a row.
        Assert.Equal([annasPot.Id], await SearchAsync(client, "  anna   kruka "));
    }

    [Fact]
    public async Task GetPage_Search_StaysWithinTheDefaultList()
    {
        var paid = await AddOrderAsync(Pay, title: "Kruka");
        var shipped = await AddOrderAsync(Ship, title: "Kruka");
        await AddOrderAsync(Pay);
        var client = await CreateAdminClientAsync();

        var page = await client.GetFromJsonAsync<PagedResult<OrderSummaryDto>>("/api/admin/orders?search=kruka");

        Assert.Equal(paid.Id, Assert.Single(page!.Items).Id);
        Assert.Equal(1, page.TotalCount);
        Assert.Equal([shipped.Id, paid.Id], await SearchAsync(client, "kruka", all: true));
    }

    [Fact]
    public async Task GetPage_TooLongSearch_ReturnsBadRequest()
    {
        var client = await CreateAdminClientAsync();

        var response = await client.GetAsync($"/api/admin/orders?search={new string('a', 101)}");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
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
        Assert.Equal(("Paket till ombud", 79m), (details.ShippingMethod, details.ShippingCost));
        Assert.Equal(979m, details.Total);
    }

    [Fact]
    public async Task GetById_PaidStripeOrder_LinksToThePaymentInStripe()
    {
        var order = await AddOrderAsync(o => o.Payment!.MarkAsPaid("pi_test_123"));
        var client = await CreateAdminClientAsync();

        var details = await client.GetFromJsonAsync<OrderDetailsDto>($"/api/admin/orders/{order.Id}");

        Assert.Equal("https://dashboard.stripe.com/test/payments/pi_test_123", details!.PaymentDashboardUrl);
    }

    [Fact]
    public async Task GetById_PaymentWithoutId_HasNoLink()
    {
        var unpaid = await AddOrderAsync();
        // Like the demo orders and those paid before AddProviderPaymentId.
        var paidWithoutId = await AddOrderAsync(Pay);
        var client = await CreateAdminClientAsync();

        var unpaidDetails = await client.GetFromJsonAsync<OrderDetailsDto>($"/api/admin/orders/{unpaid.Id}");
        var paidDetails = await client.GetFromJsonAsync<OrderDetailsDto>($"/api/admin/orders/{paidWithoutId.Id}");

        Assert.Null(unpaidDetails!.PaymentDashboardUrl);
        Assert.Null(paidDetails!.PaymentDashboardUrl);
    }

    [Fact]
    public async Task Get_OversoldOrder_NeedsAttention()
    {
        var oversold = await AddOrderAsync(PayOversold);
        await AddOrderAsync(Pay);
        var client = await CreateAdminClientAsync();

        var page = await client.GetFromJsonAsync<PagedResult<OrderSummaryDto>>("/api/admin/orders");
        var details = await client.GetFromJsonAsync<OrderDetailsDto>($"/api/admin/orders/{oversold.Id}");

        Assert.Equal([true, false], page!.Items.Select(o => o.NeedsAttention));
        Assert.True(details!.NeedsAttention);
        // Only a warning (ambiguity.md).
        Assert.True(details.CanBeShipped);
    }

    [Fact]
    public async Task GetById_UnknownId_ReturnsNotFound()
    {
        var client = await CreateAdminClientAsync();

        var response = await client.GetAsync("/api/admin/orders/999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Ship_PaidOrder_BecomesShippedAndLeavesTheDefaultList()
    {
        var order = await AddOrderAsync(Pay);
        var client = await CreateAdminClientAsync();

        var response = await client.PostAsync($"/api/admin/orders/{order.Id}/ship", null);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        var details = await client.GetFromJsonAsync<OrderDetailsDto>($"/api/admin/orders/{order.Id}");
        Assert.Equal("Shipped", details!.Status);
        Assert.False(details.CanBeShipped);
        Assert.False(details.CanBeCancelled);
        var page = await client.GetFromJsonAsync<PagedResult<OrderSummaryDto>>("/api/admin/orders");
        Assert.Empty(page!.Items);
    }

    [Fact]
    public async Task Ship_UnpaidOrder_ReturnsConflict()
    {
        var order = await AddOrderAsync();
        var client = await CreateAdminClientAsync();

        var response = await client.PostAsync($"/api/admin/orders/{order.Id}/ship", null);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        var details = await client.GetFromJsonAsync<OrderDetailsDto>($"/api/admin/orders/{order.Id}");
        Assert.Equal("Pending", details!.Status);
    }

    [Fact]
    public async Task Cancel_PaidOrder_RestoresStockAndNeedsRefund()
    {
        // The webhook decreased the stock from 3 to 1 when the order of 2 was paid.
        await AddProductAsync(stock: 1);
        var order = await AddOrderAsync(Pay);
        var client = await CreateAdminClientAsync();

        var response = await client.PostAsync($"/api/admin/orders/{order.Id}/cancel", null);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Equal(3, await GetStockAsync());
        var details = await client.GetFromJsonAsync<OrderDetailsDto>($"/api/admin/orders/{order.Id}");
        Assert.Equal(("Cancelled", "Paid"), (details!.Status, details.PaymentStatus));
        Assert.True(details.NeedsRefund);
        Assert.False(details.CanBeCancelled);
        // Still in the default list, since the admin has to refund it.
        var page = await client.GetFromJsonAsync<PagedResult<OrderSummaryDto>>("/api/admin/orders");
        Assert.Equal(order.Id, Assert.Single(page!.Items).Id);
    }

    [Fact]
    public async Task Cancel_RefundedOrder_RestoresStockAndLeavesTheDefaultList()
    {
        // The admin refunded in Stripe before cancelling in the CMS.
        await AddProductAsync(stock: 1);
        var order = await AddOrderAsync(Refund);
        var client = await CreateAdminClientAsync();

        var response = await client.PostAsync($"/api/admin/orders/{order.Id}/cancel", null);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Equal(3, await GetStockAsync());
        var details = await client.GetFromJsonAsync<OrderDetailsDto>($"/api/admin/orders/{order.Id}");
        Assert.Equal(("Cancelled", "Refunded"), (details!.Status, details.PaymentStatus));
        Assert.False(details.NeedsRefund);
        Assert.False(details.NeedsCancelling);
        var page = await client.GetFromJsonAsync<PagedResult<OrderSummaryDto>>("/api/admin/orders");
        Assert.Empty(page!.Items);
    }

    [Fact]
    public async Task Cancel_Twice_ReturnsConflictAndRestoresStockOnce()
    {
        await AddProductAsync(stock: 1);
        var order = await AddOrderAsync(Pay);
        var client = await CreateAdminClientAsync();
        await client.PostAsync($"/api/admin/orders/{order.Id}/cancel", null);

        var response = await client.PostAsync($"/api/admin/orders/{order.Id}/cancel", null);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal(3, await GetStockAsync());
    }

    [Fact]
    public async Task Cancel_UnpaidOrder_ReturnsConflict()
    {
        // An unpaid order is cancelled automatically when its payment expires (ambiguity.md).
        await AddProductAsync(stock: 3);
        var order = await AddOrderAsync();
        var client = await CreateAdminClientAsync();

        var response = await client.PostAsync($"/api/admin/orders/{order.Id}/cancel", null);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal(3, await GetStockAsync());
    }

    [Theory]
    [InlineData("ship")]
    [InlineData("cancel")]
    public async Task ChangeStatus_UnknownId_ReturnsNotFound(string action)
    {
        var client = await CreateAdminClientAsync();

        var response = await client.PostAsync($"/api/admin/orders/999/{action}", null);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Theory]
    [InlineData("ship")]
    [InlineData("cancel")]
    public async Task ChangeStatus_WithoutToken_ReturnsUnauthorized(string action)
    {
        var order = await AddOrderAsync(Pay);

        var response = await app.CreateClient().PostAsync($"/api/admin/orders/{order.Id}/{action}", null);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // As the webhook leaves them.
    private static void Pay(Order order) => order.Payment!.MarkAsPaid();

    // Another customer paid for the last item first.
    private static void PayOversold(Order order)
    {
        Pay(order);
        order.MarkAsOversold();
    }

    private static void Expire(Order order)
    {
        order.Payment!.MarkAsExpired();
        order.Cancel();
    }

    private static void Refund(Order order)
    {
        Pay(order);
        order.Payment!.MarkAsRefunded();
    }

    private static void Ship(Order order)
    {
        Pay(order);
        order.MarkAsShipped();
    }

    private static void CancelPaid(Order order)
    {
        Pay(order);
        order.CancelByAdmin();
    }

    // The usual way: cancelled in the CMS, then refunded in Stripe.
    private static void CancelAndRefund(Order order)
    {
        CancelPaid(order);
        order.Payment!.MarkAsRefunded();
    }

    // Paid, with the customer details Stripe sends.
    private static Action<Order> PaidBy(string name, string email) => order =>
    {
        Pay(order);
        order.SetCustomerDetails(new CustomerDetails(name, email, "Storgatan 1", null, "123 45", "Stockholm", "SE"));
    };

    // The ids of the orders the search finds, in the list's order.
    private static async Task<IEnumerable<int>> SearchAsync(HttpClient client, string search, bool all = false)
    {
        var url = $"/api/admin/orders?search={Uri.EscapeDataString(search)}" + (all ? "&all=true" : "");
        var page = await client.GetFromJsonAsync<PagedResult<OrderSummaryDto>>(url);
        return page!.Items.Select(o => o.Id);
    }

    // The product of AddOrderAsync's row. Only the tests that change the stock need it, since
    // the in-memory database does not check foreign keys.
    private async Task AddProductAsync(int stock)
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<GrejDbContext>();
        db.Products.Add(new Product { Id = 1, Title = "Skål", Price = 450m, Stock = stock, IsActive = true });
        await db.SaveChangesAsync();
    }

    // Read in a new scope, so it is what was saved and not what a DbContext remembers.
    private async Task<int> GetStockAsync()
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<GrejDbContext>();
        return (await db.Products.SingleAsync()).Stock;
    }

    // Its own scope = its own DbContext, like a separate request.
    private async Task<Order> AddOrderAsync(Action<Order>? handle = null, string title = "Skål")
    {
        var order = new Order();
        order.AddItem(productId: 1, title: title, unitPrice: 450m, quantity: 2);
        order.SetShipping("Paket till ombud", 79m);
        order.AddPayment("Stripe", $"cs_test_{Guid.NewGuid():N}");
        handle?.Invoke(order);

        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<GrejDbContext>();
        db.Orders.Add(order);
        await db.SaveChangesAsync();
        return order;
    }

    // Logs in the way the frontend does.
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
