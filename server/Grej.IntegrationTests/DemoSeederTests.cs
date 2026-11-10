using Grej.Application.Catalog;
using Grej.Domain.Catalog;
using Grej.Domain.Orders;
using Grej.Infrastructure.DemoData;
using Grej.Infrastructure.Persistence;
using Grej.Infrastructure.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Grej.IntegrationTests;

// Tests DemoSeeder.SeedAsync with the real demo-catalog.json, EF Core's in-memory database
// and a fake image storage. The TRUNCATE in ResetAsync only works in PostgreSQL, so it is
// tested by running reset-demo.
public class DemoSeederTests
{
    private readonly DemoCatalog catalog = DemoCatalog.Load();
    private readonly FakeImageStorage storage = new();

    // The seed and the checks use one context each on the same in-memory database, so the
    // checks see what was saved and not what the seed's context remembers.
    private readonly DbContextOptions<GrejDbContext> options = new DbContextOptionsBuilder<GrejDbContext>()
        .UseInMemoryDatabase(Guid.NewGuid().ToString())
        .Options;

    [Fact]
    public async Task SeedAsync_SavesTheWholeCatalog_OwnedByTheAdmin()
    {
        await SeedAsync();

        await using var db = new GrejDbContext(options);
        var categories = await db.Categories.ToDictionaryAsync(c => c.Id);
        var products = await db.Products.ToListAsync();

        // The file and the database written as the same kind of lines, which must match. A
        // product in a subcategory is written "Keramik › Skålar och fat", so the test also checks
        // that the subcategory is under the right main category.
        var expected = catalog.Categories.SelectMany(c => c.Products.Select(p => Describe(
            p.Subcategory is null ? c.Name : $"{c.Name} › {p.Subcategory}",
            p.Title, p.Price, p.Stock, p.IsActive, p.Materials, p.Colors)));
        var saved = products.Select(p => Describe(
            CategoryLabel(categories, p.CategoryId), p.Title, p.Price, p.Stock, p.IsActive,
            p.Materials.Select(m => m.Name), p.Colors.Select(c => c.Name)));
        Assert.Equal(expected.Order(), saved.Order());

        Assert.Equal(catalog.Materials.Order(), await db.Materials.Select(m => m.Name).OrderBy(name => name).ToListAsync());
        Assert.Equal(catalog.Colors.Order(), await db.Colors.Select(c => c.Name).OrderBy(name => name).ToListAsync());
        Assert.All(products, product => Assert.Equal("admin-id", product.SellerId));
    }

    [Fact]
    public async Task SeedAsync_UploadsAnOwnCopyOfEachImage()
    {
        await SeedAsync();

        await using var db = new GrejDbContext(options);
        var products = await db.Products.ToListAsync();
        var expected = catalog.Categories
            .SelectMany(c => c.Products.Select(p => (p.Title, Count: c.ImagesOf(p).Count)))
            .ToDictionary(entry => entry.Title, entry => entry.Count);
        Assert.All(products, product =>
        {
            Assert.Equal(expected[product.Title], product.Images.Count);
            Assert.All(product.Images, image =>
            {
                Assert.StartsWith($"products/{product.Id}/", image.StoragePath);
                Assert.Equal($"https://storage.test/{image.StoragePath}", image.Url);
            });
        });
        // One upload per image, each to a path of its own.
        Assert.Equal(expected.Values.Sum(), storage.Uploaded.Distinct().Count());
    }

    [Fact]
    public async Task SeedAsync_ProductWithImagesOfItsOwn_GetsThemInOrder()
    {
        // The file has no such product yet, so the first product gets two of the files.
        var category = catalog.Categories[0];
        var product = category.Products[0] with
        {
            Images = [new DemoImage("konst.jpg", "Första"), new DemoImage(category.Image, "Andra")],
        };
        var changed = catalog with
        {
            Categories = [category with { Products = [product, .. category.Products.Skip(1)] }, .. catalog.Categories.Skip(1)],
        };

        await SeedAsync(changed);

        await using var db = new GrejDbContext(options);
        var saved = await db.Products.SingleAsync(p => p.Title == product.Title);
        Assert.Equal(["Första", "Andra"], saved.Images.Select(image => image.AltText));
        // The other products still get their category's image.
        var other = await db.Products.FirstAsync(p => p.Title == category.Products[1].Title);
        Assert.Equal(category.ImageAltText, Assert.Single(other.Images).AltText);
    }

    [Fact]
    public async Task SeedAsync_MixesTheCategories_SoTheShopsFirstPageHasThemAll()
    {
        await SeedAsync();

        await using var db = new GrejDbContext(options);
        // The same query and page size as the shop's product list.
        var firstPage = await new ProductRepository(db).GetActivePageAsync(1, 12, new ProductFilter(), ProductSort.Newest, CancellationToken.None);

        // A product in a subcategory counts for its main category, like in the shop's filter.
        var categories = await db.Categories.ToDictionaryAsync(c => c.Id);
        var mainCategoryIds = firstPage.Items.Select(p => categories[p.CategoryId].ParentId ?? p.CategoryId);
        Assert.Equal(catalog.Categories.Count, mainCategoryIds.Distinct().Count());
    }

    [Fact]
    public async Task SeedAsync_SavesTheDemoOrders_PaidAndHandled()
    {
        await SeedAsync();

        await using var db = new GrejDbContext(options);
        var orders = await db.Orders.Include(o => o.Items).Include(o => o.Payment).OrderBy(o => o.Id).ToListAsync();

        // In the file's order. Zip pairs each demo order with the saved one in the same place.
        Assert.Equal(catalog.Orders.Count, orders.Count);
        Assert.All(catalog.Orders.Zip(orders), pair =>
        {
            var (demo, order) = pair;
            Assert.Equal(demo.Customer.Name, order.CustomerName);
            Assert.Equal(demo.Items.Count, order.Items.Count);
            // Every demo order is paid, and then handled as the file says.
            Assert.Equal(demo.Status == DemoOrderStatus.ToShip, order.CanBeShipped);
            Assert.Equal(demo.Status == DemoOrderStatus.Shipped, order.Status == OrderStatus.Shipped);
            Assert.Equal(demo.Status == DemoOrderStatus.NeedsRefund, order.NeedsRefund);
            Assert.Equal(DateTime.UtcNow.AddDays(-demo.DaysAgo), order.CreatedAt, TimeSpan.FromMinutes(1));
        });
    }

    // The real file, unless a test changes it.
    private async Task SeedAsync(DemoCatalog? changed = null)
    {
        await using var db = new GrejDbContext(options);
        await DemoSeeder.SeedAsync(db, storage, changed ?? catalog, "admin-id");
    }

    // One line per product, e.g. "Keramik: Skål i blå glasyr, 349, 6, True, Stengods, Blå".
    // E.g. "Keramik" for a main category and "Keramik › Skålar och fat" for a subcategory.
    private static string CategoryLabel(Dictionary<int, Category> categories, int id)
    {
        var category = categories[id];
        return category.ParentId is int parentId
            ? $"{categories[parentId].Name} › {category.Name}"
            : category.Name;
    }

    private static string Describe(string category, string title, decimal price, int stock, bool isActive,
        IEnumerable<string> materials, IEnumerable<string> colors) =>
        $"{category}: {title}, {price}, {stock}, {isActive}, {string.Join("/", materials.Order())}, {string.Join("/", colors.Order())}";

    // The same fake as in AdminProductImageEndpointTests: remembers the paths instead of uploading.
    private class FakeImageStorage : IImageStorage
    {
        public List<string> Uploaded { get; } = [];

        public Task<string> UploadAsync(string path, ImageFile image, CancellationToken cancellationToken)
        {
            Uploaded.Add(path);
            return Task.FromResult($"https://storage.test/{path}");
        }

        public Task DeleteAsync(string path, CancellationToken cancellationToken) => Task.CompletedTask;
    }
}
