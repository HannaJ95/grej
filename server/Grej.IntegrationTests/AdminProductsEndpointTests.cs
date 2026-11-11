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

// The real API, repositories and admin login, with EF Core's in-memory database.
public class AdminProductsEndpointTests : IClassFixture<WebApplicationFactory<Program>>
{
    private const string Email = "admin@example.com";
    private const string Password = "Test-password-1";

    // A valid packed parcel, so the requests only break the rule a test is about.
    private static readonly object Parcel = new { weightGrams = 800, lengthCm = 25, widthCm = 25, heightCm = 15 };

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
    public async Task GetPage_MainCategory_IncludesItsSubcategoriesProducts()
    {
        var keramik = await AddCategoryAsync("Keramik");
        var vaser = await AddCategoryAsync("Vaser", parentId: keramik);
        var textil = await AddCategoryAsync("Textil");
        var client = await CreateAdminClientAsync();
        await CreateProductAsync(client, "Skål", keramik);
        await CreateProductAsync(client, "Vas", vaser);
        await CreateProductAsync(client, "Kudde", textil);

        Assert.Equal(["Vas", "Skål"], await GetTitlesAsync(client, $"categoryId={keramik}"));
        Assert.Equal(["Vas"], await GetTitlesAsync(client, $"categoryId={vaser}"));
    }

    [Fact]
    public async Task GetPage_FiltersOnMaterialColorVisibilityAndSearch()
    {
        var categoryId = await AddCategoryAsync();
        var clay = await AddMaterialAsync("Lera");
        var glass = await AddMaterialAsync("Glas");
        var blue = await AddColorAsync("Blå");
        var client = await CreateAdminClientAsync();
        await CreateProductAsync(client, "Blå vas", categoryId, materialIds: [clay], colorIds: [blue]);
        await CreateProductAsync(client, "Utkast vas", categoryId, isActive: false, materialIds: [clay]);
        await CreateProductAsync(client, "Blå skål", categoryId, materialIds: [glass], colorIds: [blue]);

        Assert.Equal(["Utkast vas", "Blå vas"], await GetTitlesAsync(client, $"materialId={clay}"));
        Assert.Equal(["Blå skål", "Blå vas"], await GetTitlesAsync(client, $"colorId={blue}"));
        Assert.Equal(["Utkast vas"], await GetTitlesAsync(client, "isActive=false"));
        Assert.Equal(["Blå skål", "Blå vas"], await GetTitlesAsync(client, "isActive=true"));
        // Every word, in any case.
        Assert.Equal(["Blå vas"], await GetTitlesAsync(client, "search=VAS%20bl"));
    }

    [Fact]
    public async Task GetPage_SortsByPrice()
    {
        var categoryId = await AddCategoryAsync();
        var client = await CreateAdminClientAsync();
        await CreateProductAsync(client, "Fat", categoryId, price: 500m);
        await CreateProductAsync(client, "Skål", categoryId, price: 200m);
        await CreateProductAsync(client, "Vas", categoryId, price: 300m);

        Assert.Equal(["Skål", "Vas", "Fat"], await GetTitlesAsync(client, "sort=priceAscending"));
        Assert.Equal(["Fat", "Vas", "Skål"], await GetTitlesAsync(client, "sort=priceDescending"));
    }

    [Fact]
    public async Task Create_ValidProduct_SavesItAndReturnsCreated()
    {
        var categoryId = await AddCategoryAsync();
        var client = await CreateAdminClientAsync();

        var response = await client.PostAsJsonAsync("/api/admin/products",
            new { title = "  Vas  ", description = "Blå", price = 300m, stock = 2, isActive = true, categoryId, parcel = Parcel });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<AdminProductDto>();
        Assert.Equal($"/api/admin/products/{created!.Id}", response.Headers.Location?.AbsolutePath);
        var saved = await FindProductAsync(created.Id);
        Assert.Equal("Vas", saved?.Title);
        Assert.Equal(300m, saved?.Price);
        Assert.Equal(categoryId, saved?.CategoryId);
        Assert.Equal((800, 25, 25, 15), (saved?.WeightGrams, saved?.LengthCm, saved?.WidthCm, saved?.HeightCm));
        // The owner is the admin who was logged in (constraints.md).
        Assert.Equal(await GetAdminIdAsync(), saved?.SellerId);
        Assert.Equal(new ParcelDto(800, 25, 25, 15), created.Parcel);
    }

    [Theory]
    [InlineData(0, 25, 25, 15)]
    [InlineData(100_001, 25, 25, 15)]
    [InlineData(800, 301, 25, 15)]
    [InlineData(800, 25, 0, 15)]
    [InlineData(800, 25, 25, -1)]
    public async Task Create_InvalidParcel_ReturnsBadRequestAndSavesNothing(int weightGrams, int lengthCm, int widthCm, int heightCm)
    {
        var categoryId = await AddCategoryAsync();
        var client = await CreateAdminClientAsync();

        var response = await client.PostAsJsonAsync("/api/admin/products",
            new { title = "Vas", price = 300m, stock = 1, isActive = true, categoryId, parcel = new { weightGrams, lengthCm, widthCm, heightCm } });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(0, await CountProductsAsync());
    }

    [Fact]
    public async Task Create_WithoutParcel_ReturnsBadRequestAndSavesNothing()
    {
        var categoryId = await AddCategoryAsync();
        var client = await CreateAdminClientAsync();

        var response = await client.PostAsJsonAsync("/api/admin/products",
            new { title = "Vas", price = 300m, stock = 1, isActive = true, categoryId });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(0, await CountProductsAsync());
    }

    [Fact]
    public async Task Create_WithSize_SavesTheGivenValues()
    {
        var categoryId = await AddCategoryAsync();
        var client = await CreateAdminClientAsync();

        var response = await client.PostAsJsonAsync("/api/admin/products",
            new { title = "Kopp", price = 300m, stock = 1, isActive = true, categoryId, parcel = Parcel, size = new { heightCm = 9.5m, diameterCm = 8m, weightGrams = 350 } });

        var created = await response.Content.ReadFromJsonAsync<AdminProductDto>();
        Assert.Equal(new ProductSizeDto(null, null, 9.5m, 8m, 350), created!.Size);
        var saved = await FindProductAsync(created.Id);
        Assert.Equal((9.5m, 8m, 350), (saved?.ItemHeightCm, saved?.ItemDiameterCm, saved?.ItemWeightGrams));
    }

    [Fact]
    public async Task Create_WithoutSize_HasNoSize()
    {
        var categoryId = await AddCategoryAsync();
        var client = await CreateAdminClientAsync();

        var response = await client.PostAsJsonAsync("/api/admin/products",
            new { title = "Kopp", price = 300m, stock = 1, isActive = true, categoryId, parcel = Parcel });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<AdminProductDto>();
        Assert.Equal(new ProductSizeDto(null, null, null, null, null), created!.Size);
    }

    [Theory]
    [InlineData("lengthCm", 0)]
    [InlineData("widthCm", 1000)]
    [InlineData("heightCm", 2.25)]
    [InlineData("diameterCm", -1)]
    [InlineData("weightGrams", 0)]
    public async Task Create_InvalidSize_ReturnsBadRequestAndSavesNothing(string field, double value)
    {
        var categoryId = await AddCategoryAsync();
        var client = await CreateAdminClientAsync();

        var response = await client.PostAsJsonAsync("/api/admin/products",
            new { title = "Kopp", price = 300m, stock = 1, isActive = true, categoryId, parcel = Parcel, size = new Dictionary<string, double> { [field] = value } });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(0, await CountProductsAsync());
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
            new { title = "Vas", description = "", price = 300m, stock = 1, isActive = true, categoryId, parcel = Parcel });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(0, await CountProductsAsync());
    }

    [Fact]
    public async Task Create_WithMaterialsAndColors_SavesThem()
    {
        var categoryId = await AddCategoryAsync();
        var clay = await AddMaterialAsync("Lera");
        var glaze = await AddMaterialAsync("Glasyr");
        var blue = await AddColorAsync("Blå");
        var client = await CreateAdminClientAsync();

        var response = await client.PostAsJsonAsync("/api/admin/products",
            new { title = "Skål", price = 300m, stock = 1, isActive = true, categoryId, materialIds = new[] { clay, glaze }, colorIds = new[] { blue }, parcel = Parcel });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<AdminProductDto>();
        // Read again in a new request, so this is what was really saved.
        var saved = await client.GetFromJsonAsync<AdminProductDto>($"/api/admin/products/{created!.Id}");
        Assert.Equal([clay, glaze], saved!.MaterialIds.Order());
        Assert.Equal([blue], saved.ColorIds);
    }

    [Theory]
    // A material that does not exist, e.g. one deleted after the form was opened.
    [InlineData(new[] { 99 }, new int[] { })]
    // The same for a color.
    [InlineData(new int[] { }, new[] { 99 })]
    public async Task Create_UnknownMaterialOrColor_ReturnsBadRequestAndSavesNothing(int[] materialIds, int[] colorIds)
    {
        var categoryId = await AddCategoryAsync();
        var client = await CreateAdminClientAsync();

        var response = await client.PostAsJsonAsync("/api/admin/products",
            new { title = "Skål", price = 300m, stock = 1, isActive = true, categoryId, materialIds, colorIds, parcel = Parcel });

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
            new { title, description = "", price, stock, isActive = true, categoryId, parcel = Parcel });

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
            new { title = "Blå vas", description = "", price = 350m, stock = 3, isActive = true, categoryId = newCategoryId, originalStock = 1, parcel = Parcel });

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        var saved = await FindProductAsync(id);
        Assert.Equal("Blå vas", saved?.Title);
        Assert.Equal(3, saved?.Stock);
        Assert.True(saved?.IsActive);
        Assert.Equal(newCategoryId, saved?.CategoryId);
        Assert.Equal((800, 25, 25, 15), (saved?.WeightGrams, saved?.LengthCm, saved?.WidthCm, saved?.HeightCm));
        Assert.True(saved?.UpdatedAt > product.UpdatedAt);
    }

    [Fact]
    public async Task Update_ReplacesMaterialsAndColors()
    {
        var categoryId = await AddCategoryAsync();
        var clay = await AddMaterialAsync("Lera");
        var glass = await AddMaterialAsync("Glas");
        var blue = await AddColorAsync("Blå");
        var client = await CreateAdminClientAsync();
        // Created through the API with clay and blue, the way the form does it.
        var created = await (await client.PostAsJsonAsync("/api/admin/products",
                new { title = "Skål", price = 300m, stock = 1, isActive = true, categoryId, materialIds = new[] { clay }, colorIds = new[] { blue }, parcel = Parcel }))
            .Content.ReadFromJsonAsync<AdminProductDto>();

        var response = await client.PutAsJsonAsync($"/api/admin/products/{created!.Id}",
            new { title = "Skål", price = 300m, stock = 1, isActive = true, categoryId, materialIds = new[] { glass }, colorIds = Array.Empty<int>(), originalStock = 1, parcel = Parcel });

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        var saved = await client.GetFromJsonAsync<AdminProductDto>($"/api/admin/products/{created.Id}");
        Assert.Equal([glass], saved!.MaterialIds);
        Assert.Empty(saved.ColorIds);
    }

    [Fact]
    public async Task Update_InvalidProduct_ReturnsBadRequestAndSavesNothing()
    {
        // UpdateProductRequest inherits the rules in ProductRequest, here price > 0.
        var categoryId = await AddCategoryAsync();
        var id = await AddProductAsync(new Product { Title = "Vas", Price = 300m, Stock = 1, CategoryId = categoryId });
        var client = await CreateAdminClientAsync();

        var response = await client.PutAsJsonAsync($"/api/admin/products/{id}",
            new { title = "Blå vas", description = "", price = 0m, stock = 1, isActive = true, categoryId, originalStock = 1, parcel = Parcel });

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
            new { title = "Blå vas", description = "", price = 300m, stock = 1, isActive = true, categoryId, originalStock = 1, parcel = Parcel });

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
            new { title = "Vas", description = "", price = 300m, stock = 1, isActive = true, categoryId, originalStock = 1, parcel = Parcel });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Update_UnknownCategory_ReturnsBadRequestAndSavesNothing()
    {
        var categoryId = await AddCategoryAsync();
        var id = await AddProductAsync(new Product { Title = "Vas", Price = 300m, Stock = 1, CategoryId = categoryId });
        var client = await CreateAdminClientAsync();

        var response = await client.PutAsJsonAsync($"/api/admin/products/{id}",
            new { title = "Blå vas", description = "", price = 300m, stock = 1, isActive = true, categoryId = 99, originalStock = 1, parcel = Parcel });

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

    // Through the API, the way the form does it.
    private static async Task<int> CreateProductAsync(
        HttpClient client,
        string title,
        int categoryId,
        decimal price = 300m,
        bool isActive = true,
        int[]? materialIds = null,
        int[]? colorIds = null)
    {
        var response = await client.PostAsJsonAsync("/api/admin/products",
            new { title, price, stock = 1, isActive, categoryId, materialIds = materialIds ?? [], colorIds = colorIds ?? [], parcel = Parcel });
        return (await response.Content.ReadFromJsonAsync<AdminProductDto>())!.Id;
    }

    // In the list's order.
    private static async Task<IEnumerable<string>> GetTitlesAsync(HttpClient client, string query)
    {
        var page = await client.GetFromJsonAsync<PagedResult<AdminProductDto>>($"/api/admin/products?{query}");
        return page!.Items.Select(p => p.Title);
    }

    // A scope of its own, like a separate request, so the tests read what is really saved.
    private async Task<int> AddCategoryAsync(string name = "Keramik", int? parentId = null)
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<GrejDbContext>();
        var category = new Category { Name = name, ParentId = parentId };
        db.Categories.Add(category);
        await db.SaveChangesAsync();
        return category.Id;
    }

    private async Task<int> AddMaterialAsync(string name)
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<GrejDbContext>();
        var material = new Material { Name = name };
        db.Materials.Add(material);
        await db.SaveChangesAsync();
        return material.Id;
    }

    private async Task<int> AddColorAsync(string name)
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<GrejDbContext>();
        var color = new Color { Name = name };
        db.Colors.Add(color);
        await db.SaveChangesAsync();
        return color.Id;
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
