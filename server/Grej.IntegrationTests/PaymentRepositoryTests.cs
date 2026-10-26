using Grej.Infrastructure.Persistence;
using Grej.Infrastructure.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Grej.IntegrationTests;

// Tests the webhook event log in PaymentRepository with EF Core's in-memory database,
// like OrderRepositoryTests.
public class PaymentRepositoryTests
{
    // A new database per test. Several DbContexts can open the same one by its name.
    private readonly DbContextOptions<GrejDbContext> options = new DbContextOptionsBuilder<GrejDbContext>()
        .UseInMemoryDatabase(Guid.NewGuid().ToString())
        .Options;

    [Fact]
    public async Task AddProcessedEvent_IsProcessedAfterSave()
    {
        await using (var db = new GrejDbContext(options))
        {
            var payments = new PaymentRepository(db);
            payments.AddProcessedEvent("evt_test");
            await payments.SaveChangesAsync(CancellationToken.None);
        }

        // A new DbContext, like the next webhook request.
        await using var newDb = new GrejDbContext(options);
        var newPayments = new PaymentRepository(newDb);

        Assert.True(await newPayments.IsEventProcessedAsync("evt_test", CancellationToken.None));
        Assert.False(await newPayments.IsEventProcessedAsync("evt_other", CancellationToken.None));
    }
}
