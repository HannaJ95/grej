using Grej.Domain.Catalog;
using Grej.Infrastructure.Persistence;
using Grej.Infrastructure.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Grej.IntegrationTests;

// Tests the query in ProductRepository with EF Core's in-memory database instead
// of PostgreSQL. The LINQ runs in memory instead of as SQL, but the filter,
// order and paging are the same, and no real database is needed.
public class ProductRepositoryTests
{
    // xUnit creates a new instance of this class for each test,
    // so every test starts with its own empty database.
    private readonly GrejDbContext db = new(new DbContextOptionsBuilder<GrejDbContext>()
        .UseInMemoryDatabase(Guid.NewGuid().ToString())
        .Options);

    [Fact]
    public async Task GetActivePage_SkipsHiddenProducts_NewestFirst()
    {
        db.Products.AddRange(NewProduct(1, "Skål"), NewProduct(2, "Utkast", isActive: false), NewProduct(3, "Vas"));
        await db.SaveChangesAsync();

        var page = await new ProductRepository(db).GetActivePageAsync(1, 12, [], CancellationToken.None);

        Assert.Equal(["Vas", "Skål"], page.Items.Select(p => p.Title));
        Assert.Equal(2, page.TotalCount);
    }

    [Fact]
    public async Task GetActivePage_SecondPage_ReturnsTheRest()
    {
        db.Products.AddRange(NewProduct(1, "Skål"), NewProduct(2, "Vas"), NewProduct(3, "Fat"));
        await db.SaveChangesAsync();

        var page = await new ProductRepository(db).GetActivePageAsync(2, 2, [], CancellationToken.None);

        Assert.Equal(["Skål"], page.Items.Select(p => p.Title));
        Assert.Equal(3, page.TotalCount);
        Assert.Equal(2, page.TotalPages);
    }

    [Fact]
    public async Task GetActivePage_WithCategoryIds_OnlyReturnsThoseCategories()
    {
        db.Products.AddRange(
            NewProduct(1, "Skål", categoryId: 1),
            NewProduct(2, "Kudde", categoryId: 2),
            NewProduct(3, "Halsband", categoryId: 3),
            NewProduct(4, "Utkast", isActive: false, categoryId: 1));
        await db.SaveChangesAsync();

        // "Or": products in category 1 or 3. The hidden product is still left out.
        var page = await new ProductRepository(db).GetActivePageAsync(1, 12, [1, 3], CancellationToken.None);

        Assert.Equal(["Halsband", "Skål"], page.Items.Select(p => p.Title));
        Assert.Equal(2, page.TotalCount);
    }

    [Fact]
    public async Task GetPage_IncludesHiddenProducts_NewestFirst()
    {
        db.Products.AddRange(NewProduct(1, "Skål"), NewProduct(2, "Utkast", isActive: false), NewProduct(3, "Vas"));
        await db.SaveChangesAsync();

        var page = await new ProductRepository(db).GetPageAsync(1, 12, CancellationToken.None);

        Assert.Equal(["Vas", "Utkast", "Skål"], page.Items.Select(p => p.Title));
        Assert.Equal(3, page.TotalCount);
    }

    [Fact]
    public async Task GetByIds_ReturnsTheAskedFor_IncludingHidden()
    {
        db.Products.AddRange(NewProduct(1, "Skål"), NewProduct(2, "Utkast", isActive: false), NewProduct(3, "Vas"));
        await db.SaveChangesAsync();

        // Id 99 does not exist and is skipped.
        var products = await new ProductRepository(db).GetByIdsAsync([1, 2, 99], CancellationToken.None);

        // The order from the database is not fixed, so the titles are sorted first.
        Assert.Equal(["Skål", "Utkast"], products.Select(p => p.Title).Order());
    }

    private static Product NewProduct(int id, string title, bool isActive = true, int categoryId = 0) =>
        new() { Id = id, Title = title, Price = 100m, Stock = 1, IsActive = isActive, CategoryId = categoryId };
}
