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

// Tests GET /api/materials and GET /api/colors like CategoriesEndpointTests. xUnit runs every test
// here once for each class that inherits it, like AdminPropertiesEndpointTests.
public abstract class PropertiesEndpointTests<T> : IClassFixture<WebApplicationFactory<Program>>
    where T : ProductProperty, new()
{
    private readonly WebApplicationFactory<Program> app;

    protected PropertiesEndpointTests(WebApplicationFactory<Program> factory)
    {
        var databaseName = Guid.NewGuid().ToString();

        app = factory.WithWebHostBuilder(builder => builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<IDbContextOptionsConfiguration<GrejDbContext>>();
            services.AddDbContext<GrejDbContext>(options => options.UseInMemoryDatabase(databaseName));
        }));
    }

    protected abstract string Url { get; }

    protected abstract void AddTo(Product product, T property);

    [Fact]
    public async Task GetAll_ReturnsThoseWithActiveProducts_SortedByName_WithCounts()
    {
        var stengods = await AddPropertyAsync("Stengods");
        var bjork = await AddPropertyAsync("Björk");
        var glas = await AddPropertyAsync("Glas");
        await AddPropertyAsync("Ull");
        await AddProductWithAsync(stengods);
        await AddProductWithAsync(stengods);
        await AddProductWithAsync(stengods, isActive: false);
        await AddProductWithAsync(bjork);
        // Glas only has a hidden product and Ull none, so both are left out.
        await AddProductWithAsync(glas, isActive: false);

        var properties = await app.CreateClient().GetFromJsonAsync<List<ShopPropertyDto>>(Url);

        Assert.Equal(["Björk 1", "Stengods 2"], properties!.Select(p => $"{p.Name} {p.ProductCount}"));
    }

    [Fact]
    public async Task GetAll_NoProducts_ReturnsEmptyList()
    {
        await AddPropertyAsync("Stengods");

        var properties = await app.CreateClient().GetFromJsonAsync<List<ShopPropertyDto>>(Url);

        Assert.Empty(properties!);
    }

    // Each helper uses its own scope = its own DbContext, like a separate request.
    private async Task<int> AddPropertyAsync(string name)
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<GrejDbContext>();
        var property = new T { Name = name };
        db.Set<T>().Add(property);
        await db.SaveChangesAsync();
        return property.Id;
    }

    private async Task AddProductWithAsync(int propertyId, bool isActive = true)
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<GrejDbContext>();
        var product = new Product { Title = "Grej", Price = 100m, Stock = 1, IsActive = isActive };
        AddTo(product, (await db.Set<T>().FindAsync(propertyId))!);
        db.Products.Add(product);
        await db.SaveChangesAsync();
    }
}
