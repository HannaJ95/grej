using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Grej.Application.Catalog;
using Grej.Application.Common;
using Grej.Application.Identity;
using Grej.Domain.Catalog;
using Grej.Domain.Orders;
using Grej.Infrastructure.Identity;
using Grej.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Grej.IntegrationTests;

// Tests the CMS's product endpoints through the real API, the real repositories and a
// real admin login, with EF Core's in-memory database instead of PostgreSQL (like AdminLoginTests).
public class AdminProductsEndpointTests : IClassFixture<WebApplicationFactory<Program>>
{
    private const string Email = "admin@example.com";
    private const string Password = "Test-password-1";

    private readonly WebApplicationFactory<Program> app;

    public AdminProductsEndpointTests(WebApplicationFactory<Program> factory)
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
        var response = await app.CreateClient().GetAsync("/api/admin/products");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetPage_IncludesHiddenProductsAndStockBelowZero()
    {
        await AddProductAsync(new Product { Title = "Utkast", Price = 100m, Stock = -1, IsActive = false });
        var client = await CreateAdminClientAsync();

        var page = await client.GetFromJsonAsync<PagedResult<AdminProductDto>>("/api/admin/products");

        var product = Assert.Single(page!.Items);
        Assert.False(product.IsActive);
        Assert.Equal(-1, product.Stock);
    }

    [Fact]
    public async Task Create_ValidProduct_SavesItAndReturnsCreated()
    {
        var categoryId = await AddCategoryAsync();
        var client = await CreateAdminClientAsync();

        var response = await client.PostAsJsonAsync("/api/admin/products",
            new { title = "  Vas  ", description = "Blå", price = 300m, stock = 2, isActive = true, categoryId });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<AdminProductDto>();
        Assert.Equal($"/api/admin/products/{created!.Id}", response.Headers.Location?.AbsolutePath);
        var saved = await FindProductAsync(created.Id);
        Assert.Equal("Vas", saved?.Title);
        Assert.Equal(300m, saved?.Price);
        Assert.Equal(categoryId, saved?.CategoryId);
        // The owner is the admin who was logged in (constraints.md).
        Assert.Equal(await GetAdminIdAsync(), saved?.SellerId);
    }

    [Theory]
    // 0 = the form sent no category, which ProductRequest's [Range] stops.
    [InlineData(0)]
    // No category has this id, which AdminProductService checks.
    [InlineData(99)]
    public async Task Create_MissingOrUnknownCategory_ReturnsBadRequestAndSavesNothing(int categoryId)
    {
        var client = await CreateAdminClientAsync();

        var response = await client.PostAsJsonAsync("/api/admin/products",
            new { title = "Vas", description = "", price = 300m, stock = 1, isActive = true, categoryId });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(0, await CountProductsAsync());
    }

    [Theory]
    [InlineData("", 100, 1)]
    [InlineData("   ", 100, 1)]
    [InlineData("Vas", 0, 1)]
    [InlineData("Vas", 1_000_000, 1)]
    [InlineData("Vas", 100, -1)]
    public async Task Create_InvalidProduct_ReturnsBadRequestAndSavesNothing(string title, decimal price, int stock)
    {
        // A real category, so only the rule in InlineData is broken.
        var categoryId = await AddCategoryAsync();
        var client = await CreateAdminClientAsync();

        var response = await client.PostAsJsonAsync("/api/admin/products",
            new { title, description = "", price, stock, isActive = true, categoryId });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(0, await CountProductsAsync());
    }

    [Fact]
    public async Task Update_SavesTheChanges()
    {
        var oldCategoryId = await AddCategoryAsync("Keramik");
        var newCategoryId = await AddCategoryAsync("Glas");
        var product = new Product { Title = "Vas", Price = 300m, Stock = 1, IsActive = false, CategoryId = oldCategoryId };
        var id = await AddProductAsync(product);
        var client = await CreateAdminClientAsync();

        var response = await client.PutAsJsonAsync($"/api/admin/products/{id}",
            new { title = "Blå vas", description = "", price = 350m, stock = 3, isActive = true, categoryId = newCategoryId, originalStock = 1 });

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        var saved = await FindProductAsync(id);
        Assert.Equal("Blå vas", saved?.Title);
        Assert.Equal(3, saved?.Stock);
        Assert.True(saved?.IsActive);
        Assert.Equal(newCategoryId, saved?.CategoryId);
        Assert.True(saved?.UpdatedAt > product.UpdatedAt);
    }

    [Fact]
    public async Task Update_InvalidProduct_ReturnsBadRequestAndSavesNothing()
    {
        // UpdateProductRequest inherits the rules in ProductRequest, here price > 0.
        var categoryId = await AddCategoryAsync();
        var id = await AddProductAsync(new Product { Title = "Vas", Price = 300m, Stock = 1, CategoryId = categoryId });
        var client = await CreateAdminClientAsync();

        var response = await client.PutAsJsonAsync($"/api/admin/products/{id}",
            new { title = "Blå vas", description = "", price = 0m, stock = 1, isActive = true, categoryId, originalStock = 1 });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("Vas", (await FindProductAsync(id))?.Title);
    }

    [Fact]
    public async Task Update_StockChangedSinceFormOpened_ReturnsConflictAndSavesNothing()
    {
        // The form was opened with stock 1, then a customer bought the last one.
        var categoryId = await AddCategoryAsync();
        var id = await AddProductAsync(new Product { Title = "Vas", Price = 300m, Stock = 0, IsActive = true, CategoryId = categoryId });
        var client = await CreateAdminClientAsync();

        var response = await client.PutAsJsonAsync($"/api/admin/products/{id}",
            new { title = "Blå vas", description = "", price = 300m, stock = 1, isActive = true, categoryId, originalStock = 1 });

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        var saved = await FindProductAsync(id);
        Assert.Equal("Vas", saved?.Title);
        Assert.Equal(0, saved?.Stock);
    }

    [Fact]
    public async Task Update_UnknownProduct_ReturnsNotFound()
    {
        var categoryId = await AddCategoryAsync();
        var client = await CreateAdminClientAsync();

        var response = await client.PutAsJsonAsync("/api/admin/products/99",
            new { title = "Vas", description = "", price = 300m, stock = 1, isActive = true, categoryId, originalStock = 1 });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Update_UnknownCategory_ReturnsBadRequestAndSavesNothing()
    {
        var categoryId = await AddCategoryAsync();
        var id = await AddProductAsync(new Product { Title = "Vas", Price = 300m, Stock = 1, CategoryId = categoryId });
        var client = await CreateAdminClientAsync();

        var response = await client.PutAsJsonAsync($"/api/admin/products/{id}",
            new { title = "Blå vas", description = "", price = 300m, stock = 1, isActive = true, categoryId = 99, originalStock = 1 });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var saved = await FindProductAsync(id);
        Assert.Equal("Vas", saved?.Title);
        Assert.Equal(categoryId, saved?.CategoryId);
    }

    [Fact]
    public async Task Delete_ProductNotOnAnyOrder_DeletesIt()
    {
        var id = await AddProductAsync(new Product { Title = "Vas", Price = 300m, Stock = 1 });
        var client = await CreateAdminClientAsync();

        var response = await client.DeleteAsync($"/api/admin/products/{id}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Null(await FindProductAsync(id));
    }

    [Fact]
    public async Task Delete_ProductOnAnOrder_ReturnsConflictAndKeepsIt()
    {
        var id = await AddProductAsync(new Product { Title = "Vas", Price = 300m, Stock = 0 });
        await AddOrderAsync(id);
        var client = await CreateAdminClientAsync();

        var response = await client.DeleteAsync($"/api/admin/products/{id}");

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.NotNull(await FindProductAsync(id));
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

    // The admin's user id, the same as the "sub" claim in the admin's token.
    private async Task<string> GetAdminIdAsync()
    {
        using var scope = app.Services.CreateScope();
        var users = scope.ServiceProvider.GetRequiredService<UserManager<IdentityUser>>();
        return (await users.FindByEmailAsync(Email))!.Id;
    }

    // Each helper uses its own scope = its own DbContext, like a separate request,
    // so the tests read what is really saved, not what one DbContext remembers.
    private async Task<int> AddCategoryAsync(string name = "Keramik")
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<GrejDbContext>();
        var category = new Category { Name = name };
        db.Categories.Add(category);
        await db.SaveChangesAsync();
        return category.Id;
    }

    private async Task<int> AddProductAsync(Product product)
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<GrejDbContext>();
        db.Products.Add(product);
        await db.SaveChangesAsync();
        return product.Id;
    }

    private async Task AddOrderAsync(int productId)
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<GrejDbContext>();
        var order = new Order();
        order.AddItem(productId, title: "Vas", unitPrice: 300m, quantity: 1);
        db.Orders.Add(order);
        await db.SaveChangesAsync();
    }

    private async Task<Product?> FindProductAsync(int id)
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<GrejDbContext>();
        return await db.Products.FindAsync(id);
    }

    private async Task<int> CountProductsAsync()
    {
        using var scope = app.Services.CreateScope();
        return await scope.ServiceProvider.GetRequiredService<GrejDbContext>().Products.CountAsync();
    }
}
