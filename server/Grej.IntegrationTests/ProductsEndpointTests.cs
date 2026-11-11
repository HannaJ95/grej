using System.Net;
using System.Net.Http.Json;
using Grej.Application.Catalog;
using Grej.Application.Common;
using Grej.Domain.Catalog;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;

namespace Grej.IntegrationTests;

// The real API with a fake repository, so the tests need no database.
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

    [Fact]
    public async Task GetPage_SeveralCategoryIds_SendsThemAllToTheRepository()
    {
        var client = CreateClient(
            new Product { Id = 3, Title = "Halsband", Price = 300m, Stock = 1, IsActive = true, CategoryId = 3 },
            new Product { Id = 2, Title = "Kudde", Price = 300m, Stock = 1, IsActive = true, CategoryId = 2 },
            new Product { Id = 1, Title = "Skål", Price = 300m, Stock = 1, IsActive = true, CategoryId = 1 });

        var page = await client.GetFromJsonAsync<PagedResult<ProductDto>>("/api/products?categoryId=1&categoryId=3");

        Assert.Equal(["Halsband", "Skål"], page!.Items.Select(p => p.Title));
    }

    [Fact]
    public async Task GetPage_MainCategory_AlsoReturnsItsSubcategoriesProducts()
    {
        // Category 1 has the subcategory 4 (ambiguity.md).
        subcategories[1] = [4];
        var client = CreateClient(
            new Product { Id = 3, Title = "Vas", Price = 300m, Stock = 1, IsActive = true, CategoryId = 4 },
            new Product { Id = 2, Title = "Kudde", Price = 300m, Stock = 1, IsActive = true, CategoryId = 2 },
            new Product { Id = 1, Title = "Skål", Price = 300m, Stock = 1, IsActive = true, CategoryId = 1 });

        var page = await client.GetFromJsonAsync<PagedResult<ProductDto>>("/api/products?categoryId=1");

        Assert.Equal(["Vas", "Skål"], page!.Items.Select(p => p.Title));
    }

    [Fact]
    public async Task GetPage_MainCategoryWithAChosenSubcategory_OnlyReturnsTheChosenSubcategories()
    {
        // Keramik (1) has Skålar (4) and Vaser (5); Textil (2) has none.
        subcategories[1] = [4, 5];
        var client = CreateClient(
            new Product { Id = 4, Title = "Kudde", Price = 300m, Stock = 1, IsActive = true, CategoryId = 2 },
            new Product { Id = 3, Title = "Vas", Price = 300m, Stock = 1, IsActive = true, CategoryId = 5 },
            new Product { Id = 2, Title = "Skål", Price = 300m, Stock = 1, IsActive = true, CategoryId = 4 },
            new Product { Id = 1, Title = "Kanna", Price = 300m, Stock = 1, IsActive = true, CategoryId = 1 });

        var page = await client.GetFromJsonAsync<ProductPageDto>("/api/products?categoryId=1&categoryId=4&categoryId=2");

        Assert.Equal(["Kudde", "Skål"], page!.Items.Select(p => p.Title));
    }

    [Fact]
    public async Task GetPage_MaterialColorAndPrice_ReachTheRepository()
    {
        var client = CreateClient(new Product { Id = 1, Title = "Skål", Price = 300m, Stock = 1, IsActive = true });

        await client.GetAsync("/api/products?materialId=4&materialId=5&colorId=2&minPrice=200&maxPrice=800");

        var filter = filters[0];
        Assert.Equal([4, 5], filter.MaterialIds);
        Assert.Equal([2], filter.ColorIds);
        Assert.Equal(200m, filter.MinPrice);
        Assert.Equal(800m, filter.MaxPrice);
    }

    [Fact]
    public async Task GetPage_HighestPrice_IgnoresOnlyThePriceFilter()
    {
        var client = CreateClient(new Product { Id = 1, Title = "Skål", Price = 300m, Stock = 1, IsActive = true });

        var page = await client.GetFromJsonAsync<ProductPageDto>("/api/products?colorId=2&maxPrice=100");

        Assert.Equal(filters[0] with { MinPrice = null, MaxPrice = null }, filters[1]);
        Assert.Equal(300m, page!.HighestPrice);
    }

    [Fact]
    public async Task GetPage_Search_ReachesTheRepositoryAsWords()
    {
        var client = CreateClient(new Product { Id = 1, Title = "Skål", Price = 300m, Stock = 1, IsActive = true });

        await client.GetAsync($"/api/products?search={Uri.EscapeDataString(" blå  skål ")}");

        Assert.Equal(["blå", "skål"], filters[0].SearchWords);
    }

    [Fact]
    public async Task GetPage_TooLongSearch_ReturnsBadRequest()
    {
        var client = CreateClient();

        var response = await client.GetAsync($"/api/products?search={new string('a', 101)}");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Theory]
    [InlineData("", ProductSort.Newest)]
    [InlineData("?sort=priceAscending", ProductSort.PriceAscending)]
    [InlineData("?sort=PRICEDESCENDING", ProductSort.PriceDescending)]
    public async Task GetPage_Sort_ReachesTheRepository(string queryString, ProductSort expected)
    {
        var client = CreateClient();

        await client.GetAsync($"/api/products{queryString}");

        Assert.Equal([expected], sorts);
    }

    [Theory]
    [InlineData("?page=0")]
    [InlineData("?pageSize=49")]
    [InlineData("?categoryId=abc")]
    [InlineData("?materialId=abc")]
    [InlineData("?minPrice=-1")]
    [InlineData("?maxPrice=1000000")]
    [InlineData("?sort=popular")]
    [InlineData("?sort=7")]
    public async Task GetPage_InvalidQuery_ReturnsBadRequest(string queryString)
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
    public async Task GetById_ReturnsTheItemsOwnSize()
    {
        var client = CreateClient(new Product
        {
            Id = 1, Title = "Kopp", Price = 300m, Stock = 1, IsActive = true,
            ItemHeightCm = 9.5m, ItemDiameterCm = 8m, ItemWeightGrams = 350,
        });

        var found = await client.GetFromJsonAsync<ProductDto>("/api/products/1");

        Assert.Equal(new ProductSizeDto(null, null, 9.5m, 8m, 350), found!.Size);
    }

    [Fact]
    public async Task GetById_InactiveProduct_ReturnsNotFound()
    {
        var client = CreateClient(new Product { Id = 1, Title = "Utkast", Price = 450m, Stock = 1, IsActive = false });

        var response = await client.GetAsync("/api/products/1");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // Main category id → its subcategories' ids. Empty unless a test fills it.
    private readonly Dictionary<int, int[]> subcategories = [];

    // Every filter and sort that reached FakeProductRepository, in order.
    private readonly List<ProductFilter> filters = [];
    private readonly List<ProductSort> sorts = [];

    private HttpClient CreateClient(params Product[] products) =>
        factory.WithWebHostBuilder(builder => builder.ConfigureTestServices(services =>
            {
                services.AddScoped<IProductRepository>(_ => new FakeProductRepository(products, filters, sorts));
                services.AddScoped<ICategoryRepository>(_ => new FakeCategoryRepository(subcategories));
            }))
            .CreateClient();

    // Only knows which subcategories each main category has, which is all ProductService asks.
    private class FakeCategoryRepository(Dictionary<int, int[]> subcategories) : ICategoryRepository
    {
        public Task<IReadOnlyList<Category>> GetSubcategoriesAsync(
            IReadOnlyCollection<int> parentIds, CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<Category>>(parentIds
                .SelectMany(parentId => subcategories.GetValueOrDefault(parentId, [])
                    .Select(id => new Category { Id = id, Name = "Underkategori", ParentId = parentId }))
                .ToList());

        // The product endpoints use nothing else.
        public Task<Category?> GetByIdAsync(int id, CancellationToken cancellationToken) =>
            throw new NotImplementedException();

        public Task<bool> ExistsAsync(int id, CancellationToken cancellationToken) =>
            throw new NotImplementedException();

        public Task<PagedResult<Category>> GetPageAsync(int page, int pageSize, CancellationToken cancellationToken) =>
            throw new NotImplementedException();

        public Task<bool> HasSubcategoriesAsync(int id, CancellationToken cancellationToken) =>
            throw new NotImplementedException();

        public Task<IReadOnlyList<Category>> GetAllAsync(CancellationToken cancellationToken) =>
            throw new NotImplementedException();

        public void Add(Category category) => throw new NotImplementedException();

        public void Remove(Category category) => throw new NotImplementedException();

        public Task SaveChangesAsync(CancellationToken cancellationToken) =>
            throw new NotImplementedException();
    }

    private class FakeProductRepository(Product[] products, List<ProductFilter> filters, List<ProductSort> sorts)
        : IProductRepository
    {
        public Task<Product?> GetByIdAsync(int id, CancellationToken cancellationToken) =>
            Task.FromResult(products.FirstOrDefault(p => p.Id == id));

        // The product endpoints never fetch several products by id.
        public Task<IReadOnlyList<Product>> GetByIdsAsync(IReadOnlyCollection<int> ids, CancellationToken cancellationToken) =>
            throw new NotImplementedException();

        // Only filters on category, and doesn't sort. The rest of the filtering, the sorting and the
        // paging are tested against EF Core in ProductRepositoryTests.
        public Task<PagedResult<Product>> GetActivePageAsync(
            int page, int pageSize, ProductFilter filter, ProductSort sort, CancellationToken cancellationToken)
        {
            filters.Add(filter);
            sorts.Add(sort);
            var items = InCategories(filter).ToList();
            return Task.FromResult(new PagedResult<Product>(items, page, pageSize, items.Count));
        }

        public Task<decimal?> GetHighestActivePriceAsync(ProductFilter filter, CancellationToken cancellationToken)
        {
            filters.Add(filter);
            return Task.FromResult(InCategories(filter).Max(p => (decimal?)p.Price));
        }

        private IEnumerable<Product> InCategories(ProductFilter filter) =>
            products.Where(p => filter.CategoryIds.Count == 0 || filter.CategoryIds.Contains(p.CategoryId));

        // Only GET /api/categories uses this.
        public Task<IReadOnlyDictionary<int, int>> CountActiveByCategoryAsync(CancellationToken cancellationToken) =>
            throw new NotImplementedException();

        public Task<IReadOnlyDictionary<int, int>> CountByCategoryAsync(CancellationToken cancellationToken) =>
            throw new NotImplementedException();

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
