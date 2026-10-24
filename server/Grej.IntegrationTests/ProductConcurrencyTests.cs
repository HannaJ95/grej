using Grej.Domain.Catalog;
using Grej.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Grej.IntegrationTests;

// Tests the concurrency token on Product.Stock (ProductConfiguration) with EF Core's
// in-memory database. PostgreSQL gives the same exception when the UPDATE finds no row.
public class ProductConcurrencyTests
{
    // A new database per test. Several DbContexts can open the same one by its name.
    private readonly DbContextOptions<GrejDbContext> options = new DbContextOptionsBuilder<GrejDbContext>()
        .UseInMemoryDatabase(Guid.NewGuid().ToString())
        .Options;

    [Fact]
    public async Task SaveChanges_StockChangedByAnotherRequest_Throws()
    {
        await using (var db = new GrejDbContext(options))
        {
            db.Products.Add(new Product { Id = 1, Title = "Skål", Price = 450m, Stock = 1, IsActive = true });
            await db.SaveChangesAsync();
        }

        // Two webhooks at the same time: both read stock 1 before either has saved.
        await using var first = new GrejDbContext(options);
        await using var second = new GrejDbContext(options);
        var firstProduct = await first.Products.SingleAsync();
        var secondProduct = await second.Products.SingleAsync();
        firstProduct.DecreaseStock(1);
        secondProduct.DecreaseStock(1);

        await first.SaveChangesAsync();

        // The second one would save 0 over the 0 that is already there. It throws instead,
        // the API answers 500, and Stripe sends the webhook again, which then saves -1.
        await Assert.ThrowsAsync<DbUpdateConcurrencyException>(() => second.SaveChangesAsync());
    }
}
