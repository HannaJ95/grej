using Grej.Application.Catalog;
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
        var categoryNames = await db.Categories.ToDictionaryAsync(c => c.Id, c => c.Name);
        var products = await db.Products.ToListAsync();

        // The file and the database written as the same kind of lines, which must match.
        var expected = catalog.Categories.SelectMany(c => c.Products.Select(p =>
            Describe(c.Name, p.Title, p.Price, p.Stock, p.IsActive, p.Materials, p.Colors)));
        var saved = products.Select(p => Describe(
            categoryNames[p.CategoryId], p.Title, p.Price, p.Stock, p.IsActive,
            p.Materials.Select(m => m.Name), p.Colors.Select(c => c.Name)));
        Assert.Equal(expected.Order(), saved.Order());

        Assert.Equal(catalog.Materials.Order(), await db.Materials.Select(m => m.Name).OrderBy(name => name).ToListAsync());
        Assert.Equal(catalog.Colors.Order(), await db.Colors.Select(c => c.Name).OrderBy(name => name).ToListAsync());
        Assert.All(products, product => Assert.Equal("admin-id", product.SellerId));
    }

    [Fact]
    public async Task SeedAsync_UploadsAnOwnImageForEachProduct()
    {
        await SeedAsync();

        await using var db = new GrejDbContext(options);
        var products = await db.Products.ToListAsync();
        Assert.All(products, product =>
        {
            var image = Assert.Single(product.Images);
            Assert.StartsWith($"products/{product.Id}/", image.StoragePath);
            Assert.Equal($"https://storage.test/{image.StoragePath}", image.Url);
        });
        // One upload per product, each to a path of its own.
        Assert.Equal(products.Count, storage.Uploaded.Distinct().Count());
    }

    [Fact]
    public async Task SeedAsync_MixesTheCategories_SoTheShopsFirstPageHasThemAll()
    {
        await SeedAsync();

        await using var db = new GrejDbContext(options);
        // The same query and page size as the shop's product list.
        var firstPage = await new ProductRepository(db).GetActivePageAsync(1, 12, [], CancellationToken.None);

        Assert.Equal(catalog.Categories.Count, firstPage.Items.Select(p => p.CategoryId).Distinct().Count());
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

    private async Task SeedAsync()
    {
        await using var db = new GrejDbContext(options);
        await DemoSeeder.SeedAsync(db, storage, catalog, "admin-id");
    }

    // One line per product, e.g. "Keramik: Skål i blå glasyr, 349, 6, True, Stengods, Blå".
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
