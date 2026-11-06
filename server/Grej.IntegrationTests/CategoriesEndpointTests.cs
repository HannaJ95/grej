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

        Assert.Equal([keramik, textil], categories!.Select(c => c.Id));
        Assert.Equal(["Keramik 2", "Textil 1"], categories.Select(Describe));
    }

    [Fact]
    public async Task GetAll_PutsSubcategoriesUnderTheirMainCategory_AndCountsTheirProducts()
    {
        var keramik = await AddCategoryAsync("Keramik");
        var skalar = await AddCategoryAsync("Skålar", keramik);
        var vaser = await AddCategoryAsync("Vaser", keramik);
        var textil = await AddCategoryAsync("Textil");
        var dukar = await AddCategoryAsync("Dukar", textil);
        await AddProductsAsync(
            NewProduct(keramik),
            NewProduct(skalar),
            NewProduct(skalar),
            // Vaser only has a hidden product, so it is left out.
            NewProduct(vaser, isActive: false),
            // Textil has no products of its own, but is shown since Dukar has one.
            NewProduct(dukar));

        var categories = await app.CreateClient().GetFromJsonAsync<List<ShopCategoryDto>>("/api/categories");

        Assert.Equal(["Keramik 3 (Skålar 2)", "Textil 1 (Dukar 1)"], categories!.Select(Describe));
    }

    [Fact]
    public async Task GetAll_NoCategories_ReturnsEmptyList()
    {
        var categories = await app.CreateClient().GetFromJsonAsync<List<ShopCategoryDto>>("/api/categories");

        Assert.Empty(categories!);
    }

    // Each helper uses its own scope = its own DbContext, like a separate request.
    private async Task<int> AddCategoryAsync(string name, int? parentId = null)
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<GrejDbContext>();
        var category = new Category { Name = name, ParentId = parentId };
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

    // A category as text, e.g. "Keramik 3 (Skålar 2)", so the whole tree is easy to compare.
    private static string Describe(ShopCategoryDto category) =>
        category.Subcategories.Count == 0
            ? $"{category.Name} {category.ProductCount}"
            : $"{category.Name} {category.ProductCount} ({string.Join(", ", category.Subcategories.Select(Describe))})";

    private static Product NewProduct(int categoryId, bool isActive = true) =>
        new() { Title = "Grej", Price = 100m, Stock = 1, IsActive = isActive, CategoryId = categoryId };
}
