using Grej.Domain.Orders;
using Grej.Infrastructure.Persistence;
using Grej.Infrastructure.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Grej.IntegrationTests;

// Tests the queries in OrderRepository with EF Core's in-memory database,
// like ProductRepositoryTests.
public class OrderRepositoryTests
{
    // A new database per test. Several DbContexts can open the same one by its name.
    private readonly DbContextOptions<GrejDbContext> options = new DbContextOptionsBuilder<GrejDbContext>()
        .UseInMemoryDatabase(Guid.NewGuid().ToString())
        .Options;

    [Fact]
    public async Task GetById_IncludesTheRows()
    {
        var order = new Order();
        order.AddItem(productId: 1, title: "Skål", unitPrice: 450m, quantity: 2);
        await using (var db = new GrejDbContext(options))
        {
            await new OrderRepository(db).AddAsync(order, CancellationToken.None);
        }

        // A new DbContext, like a new request: it has not seen the order above,
        // so the rows are only there if the query fetches them.
        await using var newDb = new GrejDbContext(options);
        var found = await new OrderRepository(newDb).GetByIdAsync(order.Id, CancellationToken.None);

        Assert.NotNull(found);
        var item = Assert.Single(found.Items);
        Assert.Equal(2, item.Quantity);
    }

    [Fact]
    public async Task ContainsProduct_TrueOnlyForOrderedProducts()
    {
        var order = new Order();
        order.AddItem(productId: 1, title: "Skål", unitPrice: 450m, quantity: 1);
        await using var db = new GrejDbContext(options);
        var orders = new OrderRepository(db);
        await orders.AddAsync(order, CancellationToken.None);

        Assert.True(await orders.ContainsProductAsync(1, CancellationToken.None));
        Assert.False(await orders.ContainsProductAsync(2, CancellationToken.None));
    }
}
