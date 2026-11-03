using Grej.Domain.Orders;
using Grej.Infrastructure.Persistence;
using Grej.Infrastructure.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Grej.IntegrationTests;

// Tests PaymentRepository with EF Core's in-memory database, like OrderRepositoryTests.
public class PaymentRepositoryTests
{
    // A new database per test. Several DbContexts can open the same one by its name.
    private readonly DbContextOptions<GrejDbContext> options = new DbContextOptionsBuilder<GrejDbContext>()
        .UseInMemoryDatabase(Guid.NewGuid().ToString())
        .Options;

    // Checkout's events carry the session id, and refund events the PaymentIntent id.
    [Theory]
    [InlineData("cs_test_123")]
    [InlineData("pi_test_123")]
    public async Task GetByReference_FindsPaymentBySessionOrPaymentIntent(string reference)
    {
        var order = new Order();
        order.AddItem(productId: 1, title: "Skål", unitPrice: 450m, quantity: 1);
        order.AddPayment("Stripe", "cs_test_123");
        order.Payment!.MarkAsPaid("pi_test_123");
        await using (var db = new GrejDbContext(options))
        {
            await new OrderRepository(db).AddAsync(order, CancellationToken.None);
        }

        // A new DbContext, like the next webhook request.
        await using var newDb = new GrejDbContext(options);
        var payments = new PaymentRepository(newDb);

        var found = await payments.GetByReferenceAsync(reference, CancellationToken.None);
        Assert.NotNull(found);
        Assert.Equal(order.Payment.Id, found.Id);
        Assert.Null(await payments.GetByReferenceAsync("pi_test_other", CancellationToken.None));
    }

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
