using System.Net;
using System.Net.Http.Json;
using Grej.Application.Catalog;
using Grej.Application.Common;
using Grej.Domain.Catalog;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;

namespace Grej.IntegrationTests;

// Tests GET /api/products and GET /api/products/{id} through the real API, but with
// a fake repository instead of the database, so the tests need no database.
public class ProductsEndpointTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task GetPage_ReturnsProductsAndPageInfo()
    {
        var client = CreateClient(
            new Product { Id = 2, Title = "Vas", Price = 300m, Stock = 1, IsActive = true },
            new Product { Id = 1, Title = "Skål", Price = 450m, Stock = 0, IsActive = true });

        var response = await client.GetAsync("/api/products?page=1&pageSize=12");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var page = await response.Content.ReadFromJsonAsync<PagedResult<ProductDto>>();
        Assert.NotNull(page);
        Assert.Equal(2, page.TotalCount);
        Assert.Equal("Vas", page.Items[0].Title);
        Assert.True(page.Items[1].IsSoldOut);
    }

    [Theory]
    [InlineData("?page=0")]
    [InlineData("?pageSize=49")]
    public async Task GetPage_InvalidPaging_ReturnsBadRequest(string queryString)
    {
        var client = CreateClient();

        var response = await client.GetAsync($"/api/products{queryString}");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

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
    public async Task GetById_ReturnsMaterialAndColorNamesSortedByName()
    {
        var product = new Product { Id = 1, Title = "Skål", Price = 450m, Stock = 1, IsActive = true };
        product.SetMaterials([new Material { Name = "Lera" }, new Material { Name = "Glasyr" }]);
        product.SetColors([new Color { Name = "Vit" }, new Color { Name = "Blå" }]);
        var client = CreateClient(product);

        var found = await client.GetFromJsonAsync<ProductDto>("/api/products/1");

        Assert.Equal(["Glasyr", "Lera"], found!.Materials);
        Assert.Equal(["Blå", "Vit"], found.Colors);
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

        // The product endpoints never fetch several products by id.
        public Task<IReadOnlyList<Product>> GetByIdsAsync(IReadOnlyCollection<int> ids, CancellationToken cancellationToken) =>
            throw new NotImplementedException();

        // Returns the products as they are. Filtering and paging are tested
        // against EF Core in ProductRepositoryTests.
        public Task<PagedResult<Product>> GetActivePageAsync(int page, int pageSize, CancellationToken cancellationToken) =>
            Task.FromResult(new PagedResult<Product>(products, page, pageSize, products.Length));

        // Only the CMS uses these.
        public Task<PagedResult<Product>> GetPageAsync(int page, int pageSize, CancellationToken cancellationToken) =>
            throw new NotImplementedException();
        public Task<bool> AnyInCategoryAsync(int categoryId, CancellationToken cancellationToken) =>
            throw new NotImplementedException();
        public void Add(Product product) => throw new NotImplementedException();
        public void Remove(Product product) => throw new NotImplementedException();
        public Task SaveChangesAsync(CancellationToken cancellationToken) => throw new NotImplementedException();
    }
}
