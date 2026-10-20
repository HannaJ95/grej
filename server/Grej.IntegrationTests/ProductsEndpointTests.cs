using System.Net;
using System.Net.Http.Json;
using Grej.Application.Catalog;
using Grej.Domain.Catalog;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;

namespace Grej.IntegrationTests;

// Tests GET /api/products/{id} through the real API, but with a fake
// repository instead of the database, so the tests need no database.
public class ProductsEndpointTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task GetById_ActiveProduct_ReturnsProduct()
    {
        var client = CreateClient(new Product { Id = 1, Title = "Skål", Price = 450m, Stock = 0, IsActive = true });

        var response = await client.GetAsync("/api/products/1");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var product = await response.Content.ReadFromJsonAsync<ProductDto>();
        Assert.NotNull(product);
        Assert.Equal("Skål", product.Title);
        Assert.True(product.IsSoldOut);
    }

    [Fact]
    public async Task GetById_InactiveProduct_ReturnsNotFound()
    {
        var client = CreateClient(new Product { Id = 1, Title = "Utkast", Price = 450m, Stock = 1, IsActive = false });

        var response = await client.GetAsync("/api/products/1");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // Starts the API with the given products instead of the database.
    private HttpClient CreateClient(params Product[] products) =>
        factory.WithWebHostBuilder(builder => builder.ConfigureTestServices(services =>
                services.AddScoped<IProductRepository>(_ => new FakeProductRepository(products))))
            .CreateClient();

    private class FakeProductRepository(Product[] products) : IProductRepository
    {
        public Task<Product?> GetByIdAsync(int id, CancellationToken cancellationToken) =>
            Task.FromResult(products.FirstOrDefault(p => p.Id == id));
    }
}
