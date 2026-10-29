using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Grej.Application.Catalog;
using Grej.Application.Common;
using Grej.Application.Identity;
using Grej.Domain.Catalog;
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

// Tests the CMS's endpoints for materials and colors the same way as AdminCategoriesEndpointTests.
// Abstract and generic like AdminPropertiesController: xUnit runs every test here once for each
// class that inherits it, i.e. once for materials and once for colors.
public abstract class AdminPropertiesEndpointTests<T> : IClassFixture<WebApplicationFactory<Program>>
    where T : ProductProperty, new()
{
    private const string Email = "admin@example.com";
    private const string Password = "Test-password-1";

    private readonly WebApplicationFactory<Program> app;

    protected AdminPropertiesEndpointTests(WebApplicationFactory<Program> factory)
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

    // E.g. "/api/admin/materials". Each class that inherits this one gives its own.
    protected abstract string Url { get; }

    // Gives the product the material or color, with SetMaterials or SetColors.
    protected abstract void AddTo(Product product, T property);

    [Fact]
    public async Task GetPage_WithoutToken_ReturnsUnauthorized()
    {
        var response = await app.CreateClient().GetAsync(Url);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetPage_ReturnsThemSortedByName()
    {
        await AddPropertyAsync("Lera");
        await AddPropertyAsync("Glas");
        var client = await CreateAdminClientAsync();

        var page = await client.GetFromJsonAsync<PagedResult<PropertyDto>>(Url);

        Assert.Equal(["Glas", "Lera"], page!.Items.Select(p => p.Name));
    }

    [Fact]
    public async Task Create_ValidName_SavesItAndReturnsCreated()
    {
        var client = await CreateAdminClientAsync();

        var response = await client.PostAsJsonAsync(Url, new { name = "  Lera  " });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<PropertyDto>();
        Assert.Equal($"{Url}/{created!.Id}", response.Headers.Location?.AbsolutePath);
        Assert.Equal("Lera", (await FindPropertyAsync(created.Id))?.Name);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task Create_EmptyName_ReturnsBadRequestAndSavesNothing(string name)
    {
        var client = await CreateAdminClientAsync();

        var response = await client.PostAsJsonAsync(Url, new { name });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(0, await CountPropertiesAsync());
    }

    [Fact]
    public async Task GetById_CountsTheProductsThatHaveIt()
    {
        var id = await AddPropertyAsync("Lera");
        var otherId = await AddPropertyAsync("Glas");
        await AddProductWithAsync(id);
        await AddProductWithAsync(id);
        await AddProductWithAsync(otherId);
        var client = await CreateAdminClientAsync();

        var property = await client.GetFromJsonAsync<PropertyDetailsDto>($"{Url}/{id}");

        Assert.Equal(new PropertyDetailsDto(id, "Lera", 2), property);
    }

    [Fact]
    public async Task Update_RenamesIt()
    {
        var id = await AddPropertyAsync("Lera");
        var client = await CreateAdminClientAsync();

        var response = await client.PutAsJsonAsync($"{Url}/{id}", new { name = "Glas" });

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Equal("Glas", (await FindPropertyAsync(id))?.Name);
    }

    [Fact]
    public async Task Update_Unknown_ReturnsNotFound()
    {
        var client = await CreateAdminClientAsync();

        var response = await client.PutAsJsonAsync($"{Url}/99", new { name = "Glas" });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Delete_RemovesItAlsoFromItsProducts()
    {
        var id = await AddPropertyAsync("Lera");
        var productId = await AddProductWithAsync(id);
        var client = await CreateAdminClientAsync();

        var response = await client.DeleteAsync($"{Url}/{id}");

        // Unlike a category, products do not stop the delete. The product is kept.
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Null(await FindPropertyAsync(id));
        Assert.Equal(0, await CountPropertiesOnProductAsync(productId));
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

    // Each helper uses its own scope = its own DbContext, like a separate request.
    // db.Set<T>() is Materials or Colors, as in PropertyRepository.
    private async Task<int> AddPropertyAsync(string name)
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<GrejDbContext>();
        var property = new T { Name = name };
        db.Set<T>().Add(property);
        await db.SaveChangesAsync();
        return property.Id;
    }

    private async Task<int> AddProductWithAsync(int propertyId)
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<GrejDbContext>();
        var product = new Product { Title = "Skål", Price = 450m };
        AddTo(product, (await db.Set<T>().FindAsync(propertyId))!);
        db.Products.Add(product);
        await db.SaveChangesAsync();
        return product.Id;
    }

    private async Task<T?> FindPropertyAsync(int id)
    {
        using var scope = app.Services.CreateScope();
        return await scope.ServiceProvider.GetRequiredService<GrejDbContext>().Set<T>().FindAsync(id);
    }

    private async Task<int> CountPropertiesAsync()
    {
        using var scope = app.Services.CreateScope();
        return await scope.ServiceProvider.GetRequiredService<GrejDbContext>().Set<T>().CountAsync();
    }

    // How many materials or colors the product has. The product must still exist.
    private async Task<int> CountPropertiesOnProductAsync(int productId)
    {
        using var scope = app.Services.CreateScope();
        var product = await scope.ServiceProvider.GetRequiredService<GrejDbContext>().Products
            .SingleAsync(p => p.Id == productId);
        return product.Materials.Count + product.Colors.Count;
    }
}
