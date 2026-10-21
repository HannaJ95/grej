using Grej.Domain.Orders;
using Grej.Domain.Payments;

namespace Grej.UnitTests.Orders;

public class OrderTests
{
    [Fact]
    public void NewOrder_IsPendingWithOrderNumber()
    {
        var order = new Order();

        Assert.Equal(OrderStatus.Pending, order.Status);
        Assert.Matches("^GREJ-[0-9A-F]{8}$", order.OrderNumber);
    }

    [Fact]
    public void AddItem_TotalIsSumOfRows()
    {
        var order = new Order();

        order.AddItem(productId: 1, title: "Skål", unitPrice: 450m, quantity: 2);
        order.AddItem(productId: 2, title: "Tavla", unitPrice: 1200.50m, quantity: 1);

        Assert.Equal(2, order.Items.Count);
        Assert.Equal(2100.50m, order.Total);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void AddItem_QuantityNotPositive_Throws(int quantity)
    {
        var order = new Order();

        Assert.Throws<ArgumentOutOfRangeException>(() => order.AddItem(1, "Skål", 450m, quantity));
        Assert.Empty(order.Items);
    }

    [Fact]
    public void AddPayment_IsPendingWithOrderTotal()
    {
        var order = new Order();
        order.AddItem(1, "Skål", 450m, 2);

        order.AddPayment("Stripe", "cs_test_123");

        Assert.NotNull(order.Payment);
        Assert.Equal(PaymentStatus.Pending, order.Payment.Status);
        Assert.Equal(900m, order.Payment.Amount);
        Assert.Equal("SEK", order.Payment.Currency);
        Assert.Equal("cs_test_123", order.Payment.ProviderReference);
    }
}
