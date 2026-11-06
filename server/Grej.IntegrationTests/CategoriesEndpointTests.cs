using System.Net.Http.Json;
using Grej.Application.Catalog;
using Grej.Domain.Catalog;
using Grej.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Grej.IntegrationTests;

// Tests GET /api/categories through the real API and repositories, with EF Core's in-memory
// database like AdminCategoriesEndpointTests. No login, since the endpoint is open.
public class CategoriesEndpointTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> app;

    public CategoriesEndpointTests(WebApplicationFactory<Program> factory)
    {
        // A new empty in-memory database for each test.
        var databaseName = Guid.NewGuid().ToString();

        app = factory.WithWebHostBuilder(builder => builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<IDbContextOptionsConfiguration<GrejDbContext>>();
            services.AddDbContext<GrejDbContext>(options => options.UseInMemoryDatabase(databaseName));
        }));
    }

    [Fact]
    public async Task GetAll_ReturnsCategoriesWithActiveProducts_SortedByName_WithCounts()
    {
        var textil = await AddCategoryAsync("Textil");
        var keramik = await AddCategoryAsync("Keramik");
        var empty = await AddCategoryAsync("Glas");
        await AddProductsAsync(
            NewProduct(keramik),
            NewProduct(keramik),
            // Hidden products are not counted.
            NewProduct(keramik, isActive: false),
            NewProduct(textil),
            // Glas only has a hidden product, so it is left out.
            NewProduct(empty, isActive: false));

        var categories = await app.CreateClient().GetFromJsonAsync<List<ShopCategoryDto>>("/api/categories");

        Assert.Equal(
            [new ShopCategoryDto(keramik, "Keramik", 2), new ShopCategoryDto(textil, "Textil", 1)],
            categories);
    }

    [Fact]
    public async Task GetAll_NoCategories_ReturnsEmptyList()
    {
        var categories = await app.CreateClient().GetFromJsonAsync<List<ShopCategoryDto>>("/api/categories");

        Assert.Empty(categories!);
    }

    // Each helper uses its own scope = its own DbContext, like a separate request.
    private async Task<int> AddCategoryAsync(string name)
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<GrejDbContext>();
        var category = new Category { Name = name };
        db.Categories.Add(category);
        await db.SaveChangesAsync();
        return category.Id;
    }

    private async Task AddProductsAsync(params Product[] products)
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<GrejDbContext>();
        db.Products.AddRange(products);
        await db.SaveChangesAsync();
    }

    private static Product NewProduct(int categoryId, bool isActive = true) =>
        new() { Title = "Grej", Price = 100m, Stock = 1, IsActive = isActive, CategoryId = categoryId };
}
