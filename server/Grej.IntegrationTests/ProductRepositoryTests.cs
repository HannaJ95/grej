using Grej.Application.Catalog;
using Grej.Domain.Catalog;
using Grej.Infrastructure.Persistence;
using Grej.Infrastructure.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Grej.IntegrationTests;

// EF Core's in-memory database runs the LINQ in memory instead of as SQL, but the filters, order
// and paging are the same.
public class ProductRepositoryTests
{
    // A new database per test, since xUnit creates a new instance for each test.
    private readonly GrejDbContext db = new(new DbContextOptionsBuilder<GrejDbContext>()
        .UseInMemoryDatabase(Guid.NewGuid().ToString())
        .Options);

    // Not static: EF Core fills in each material's products, which another test must not see.
    private readonly Material lera = new() { Id = 1, Name = "Lera" };
    private readonly Material glas = new() { Id = 2, Name = "Glas" };
    private readonly Material linne = new() { Id = 3, Name = "Linne" };
    private readonly Color blå = new() { Id = 1, Name = "Blå" };
    private readonly Color vit = new() { Id = 2, Name = "Vit" };

    [Fact]
    public async Task GetActivePage_SkipsHiddenProducts_NewestFirst()
    {
        db.Products.AddRange(NewProduct(1, "Skål"), NewProduct(2, "Utkast", isActive: false), NewProduct(3, "Vas"));
        await db.SaveChangesAsync();

        var page = await new ProductRepository(db).GetActivePageAsync(1, 12, new ProductFilter(), CancellationToken.None);

        Assert.Equal(["Vas", "Skål"], page.Items.Select(p => p.Title));
        Assert.Equal(2, page.TotalCount);
    }

    [Fact]
    public async Task GetActivePage_SecondPage_ReturnsTheRest()
    {
        db.Products.AddRange(NewProduct(1, "Skål"), NewProduct(2, "Vas"), NewProduct(3, "Fat"));
        await db.SaveChangesAsync();

        var page = await new ProductRepository(db).GetActivePageAsync(2, 2, new ProductFilter(), CancellationToken.None);

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

        var page = await new ProductRepository(db).GetActivePageAsync(
            1, 12, new ProductFilter { CategoryIds = [1, 3] }, CancellationToken.None);

        Assert.Equal(["Halsband", "Skål"], page.Items.Select(p => p.Title));
        Assert.Equal(2, page.TotalCount);
    }

    [Fact]
    public async Task GetActivePage_SeveralMaterials_ReturnsProductsWithAnyOfThem()
    {
        await AddMaterialAndColorProductsAsync();

        var page = await new ProductRepository(db).GetActivePageAsync(
            1, 12, new ProductFilter { MaterialIds = [lera.Id, glas.Id] }, CancellationToken.None);

        Assert.Equal(["Vit skål", "Vit vas", "Blå skål"], page.Items.Select(p => p.Title));
    }

    [Fact]
    public async Task GetActivePage_MaterialAndColor_ReturnsProductsWithBoth()
    {
        await AddMaterialAndColorProductsAsync();

        var page = await new ProductRepository(db).GetActivePageAsync(
            1, 12, new ProductFilter { MaterialIds = [lera.Id, glas.Id], ColorIds = [blå.Id] }, CancellationToken.None);

        Assert.Equal(["Blå skål"], page.Items.Select(p => p.Title));
    }

    [Fact]
    public async Task GetActivePage_PriceRange_IncludesBothLimits()
    {
        db.Products.AddRange(
            NewProduct(1, "Kort", price: 100m),
            NewProduct(2, "Skål", price: 200m),
            NewProduct(3, "Vas", price: 300m),
            NewProduct(4, "Tavla", price: 400m));
        await db.SaveChangesAsync();

        var page = await new ProductRepository(db).GetActivePageAsync(
            1, 12, new ProductFilter { MinPrice = 200m, MaxPrice = 300m }, CancellationToken.None);

        Assert.Equal(["Vas", "Skål"], page.Items.Select(p => p.Title));
    }

    [Fact]
    public async Task GetHighestActivePrice_OnlyCountsActiveMatchingProducts_NullWhenNoneMatch()
    {
        db.Products.AddRange(
            NewProduct(1, "Skål", categoryId: 1, price: 300m),
            NewProduct(2, "Tavla", categoryId: 2, price: 900m),
            NewProduct(3, "Utkast", isActive: false, categoryId: 1, price: 5000m));
        await db.SaveChangesAsync();
        var repository = new ProductRepository(db);

        var inCategory = await repository.GetHighestActivePriceAsync(
            new ProductFilter { CategoryIds = [1] }, CancellationToken.None);
        var noMatch = await repository.GetHighestActivePriceAsync(
            new ProductFilter { CategoryIds = [3] }, CancellationToken.None);

        Assert.Equal(300m, inCategory);
        Assert.Null(noMatch);
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

        // The order from the database is not fixed.
        Assert.Equal(["Skål", "Utkast"], products.Select(p => p.Title).Order());
    }

    private async Task AddMaterialAndColorProductsAsync()
    {
        db.Products.AddRange(
            NewProduct(1, "Blå skål", materials: [lera], colors: [blå]),
            NewProduct(2, "Vit vas", materials: [glas], colors: [vit]),
            NewProduct(3, "Blå duk", materials: [linne], colors: [blå]),
            NewProduct(4, "Vit skål", materials: [lera, glas], colors: [vit]));
        await db.SaveChangesAsync();
    }

    private static Product NewProduct(
        int id,
        string title,
        bool isActive = true,
        int categoryId = 0,
        decimal price = 100m,
        IEnumerable<Material>? materials = null,
        IEnumerable<Color>? colors = null)
    {
        var product = new Product
        {
            Id = id, Title = title, Price = price, Stock = 1, IsActive = isActive, CategoryId = categoryId,
        };
        product.SetMaterials(materials ?? []);
        product.SetColors(colors ?? []);
        return product;
    }
}
