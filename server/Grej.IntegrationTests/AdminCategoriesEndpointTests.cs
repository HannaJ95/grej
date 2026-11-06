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

// Tests the CMS's category endpoints the same way as AdminProductsEndpointTests: the real
// API, repositories and admin login, with EF Core's in-memory database.
public class AdminCategoriesEndpointTests : IClassFixture<WebApplicationFactory<Program>>
{
    private const string Email = "admin@example.com";
    private const string Password = "Test-password-1";

    private readonly WebApplicationFactory<Program> app;

    public AdminCategoriesEndpointTests(WebApplicationFactory<Program> factory)
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
        var response = await app.CreateClient().GetAsync("/api/admin/categories");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetPage_ReturnsCategoriesSortedByName()
    {
        await AddCategoryAsync("Textil");
        await AddCategoryAsync("Keramik");
        var client = await CreateAdminClientAsync();

        var page = await client.GetFromJsonAsync<PagedResult<CategoryDto>>("/api/admin/categories");

        Assert.Equal(["Keramik", "Textil"], page!.Items.Select(c => c.Name));
    }

    [Fact]
    public async Task GetPage_PutsEachSubcategoryAfterItsMainCategory()
    {
        var textil = await AddCategoryAsync("Textil");
        var keramik = await AddCategoryAsync("Keramik");
        await AddCategoryAsync("Vaser", keramik);
        await AddCategoryAsync("Dukar", textil);
        await AddCategoryAsync("Muggar", keramik);
        var client = await CreateAdminClientAsync();

        var page = await client.GetFromJsonAsync<PagedResult<CategoryDto>>("/api/admin/categories");

        Assert.Equal(["Keramik", "Muggar", "Vaser", "Textil", "Dukar"], page!.Items.Select(c => c.Name));
        Assert.Equal([null, "Keramik", "Keramik", null, "Textil"], page.Items.Select(c => c.ParentName));
    }

    [Fact]
    public async Task Create_ValidName_SavesItAndReturnsCreated()
    {
        var client = await CreateAdminClientAsync();

        var response = await client.PostAsJsonAsync("/api/admin/categories", new { name = "  Keramik  " });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<CategoryDto>();
        Assert.Equal($"/api/admin/categories/{created!.Id}", response.Headers.Location?.AbsolutePath);
        Assert.Equal("Keramik", (await FindCategoryAsync(created.Id))?.Name);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task Create_EmptyName_ReturnsBadRequestAndSavesNothing(string name)
    {
        var client = await CreateAdminClientAsync();

        var response = await client.PostAsJsonAsync("/api/admin/categories", new { name });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(0, await CountCategoriesAsync());
    }

    [Fact]
    public async Task Create_WithMainCategory_SavesASubcategory()
    {
        var keramik = await AddCategoryAsync("Keramik");
        var client = await CreateAdminClientAsync();

        var response = await client.PostAsJsonAsync("/api/admin/categories", new { name = "Skålar", parentId = keramik });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<CategoryDto>();
        Assert.Equal(keramik, created!.ParentId);
        Assert.Equal("Keramik", created.ParentName);
        Assert.Equal(keramik, (await FindCategoryAsync(created.Id))?.ParentId);
    }

    [Fact]
    public async Task Create_UnknownMainCategory_ReturnsBadRequestAndSavesNothing()
    {
        var client = await CreateAdminClientAsync();

        var response = await client.PostAsJsonAsync("/api/admin/categories", new { name = "Skålar", parentId = 99 });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(0, await CountCategoriesAsync());
    }

    [Fact]
    public async Task Create_UnderASubcategory_ReturnsBadRequest()
    {
        // Only one level (ambiguity.md).
        var keramik = await AddCategoryAsync("Keramik");
        var skalar = await AddCategoryAsync("Skålar", keramik);
        var client = await CreateAdminClientAsync();

        var response = await client.PostAsJsonAsync("/api/admin/categories", new { name = "Små skålar", parentId = skalar });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(2, await CountCategoriesAsync());
    }

    [Fact]
    public async Task Update_RenamesTheCategory()
    {
        var id = await AddCategoryAsync("Keramik");
        var client = await CreateAdminClientAsync();

        var response = await client.PutAsJsonAsync($"/api/admin/categories/{id}", new { name = "Glas" });

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Equal("Glas", (await FindCategoryAsync(id))?.Name);
    }

    [Fact]
    public async Task Update_SubcategoryWithoutParent_BecomesAMainCategory()
    {
        var keramik = await AddCategoryAsync("Keramik");
        var skalar = await AddCategoryAsync("Skålar", keramik);
        var client = await CreateAdminClientAsync();

        var response = await client.PutAsJsonAsync($"/api/admin/categories/{skalar}", new { name = "Skålar" });

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Null((await FindCategoryAsync(skalar))?.ParentId);
    }

    [Fact]
    public async Task Update_ItselfAsMainCategory_ReturnsBadRequest()
    {
        var keramik = await AddCategoryAsync("Keramik");
        var client = await CreateAdminClientAsync();

        var response = await client.PutAsJsonAsync($"/api/admin/categories/{keramik}", new { name = "Keramik", parentId = keramik });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Null((await FindCategoryAsync(keramik))?.ParentId);
    }

    [Fact]
    public async Task Update_CategoryWithSubcategories_CannotBecomeASubcategory()
    {
        // It would give two levels: Textil → Keramik → Skålar.
        var textil = await AddCategoryAsync("Textil");
        var keramik = await AddCategoryAsync("Keramik");
        await AddCategoryAsync("Skålar", keramik);
        var client = await CreateAdminClientAsync();

        var response = await client.PutAsJsonAsync($"/api/admin/categories/{keramik}", new { name = "Keramik", parentId = textil });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Null((await FindCategoryAsync(keramik))?.ParentId);
    }

    [Fact]
    public async Task Update_UnknownCategory_ReturnsNotFound()
    {
        var client = await CreateAdminClientAsync();

        var response = await client.PutAsJsonAsync("/api/admin/categories/99", new { name = "Glas" });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Delete_CategoryWithoutProducts_DeletesIt()
    {
        var id = await AddCategoryAsync("Keramik");
        var client = await CreateAdminClientAsync();

        var response = await client.DeleteAsync($"/api/admin/categories/{id}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Null(await FindCategoryAsync(id));
    }

    [Fact]
    public async Task Delete_CategoryWithProducts_ReturnsConflictAndKeepsIt()
    {
        // A hidden product counts too: it would be left without a category.
        var id = await AddCategoryAsync("Keramik");
        await AddProductAsync(new Product { Title = "Skål", Price = 450m, CategoryId = id, IsActive = false });
        var client = await CreateAdminClientAsync();

        var response = await client.DeleteAsync($"/api/admin/categories/{id}");

        // The in-memory database has no foreign keys, so this proves AdminCategoryService's check.
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("hasProducts", await ReadReasonAsync(response));
        Assert.NotNull(await FindCategoryAsync(id));
    }

    [Fact]
    public async Task Delete_CategoryWithSubcategories_ReturnsConflictAndKeepsIt()
    {
        var keramik = await AddCategoryAsync("Keramik");
        await AddCategoryAsync("Skålar", keramik);
        var client = await CreateAdminClientAsync();

        var response = await client.DeleteAsync($"/api/admin/categories/{keramik}");

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("hasSubcategories", await ReadReasonAsync(response));
        Assert.NotNull(await FindCategoryAsync(keramik));
    }

    // The "reason" in a 409 answer's body, e.g. { "reason": "hasProducts" }.
    private static async Task<string?> ReadReasonAsync(HttpResponseMessage response)
    {
        var body = await response.Content.ReadFromJsonAsync<Dictionary<string, string>>();
        return body?["reason"];
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
    private async Task<int> AddCategoryAsync(string name, int? parentId = null)
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<GrejDbContext>();
        var category = new Category { Name = name, ParentId = parentId };
        db.Categories.Add(category);
        await db.SaveChangesAsync();
        return category.Id;
    }

    private async Task AddProductAsync(Product product)
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<GrejDbContext>();
        db.Products.Add(product);
        await db.SaveChangesAsync();
    }

    private async Task<Category?> FindCategoryAsync(int id)
    {
        using var scope = app.Services.CreateScope();
        return await scope.ServiceProvider.GetRequiredService<GrejDbContext>().Categories.FindAsync(id);
    }

    private async Task<int> CountCategoriesAsync()
    {
        using var scope = app.Services.CreateScope();
        return await scope.ServiceProvider.GetRequiredService<GrejDbContext>().Categories.CountAsync();
    }
}
