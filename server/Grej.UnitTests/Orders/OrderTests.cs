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

    [Fact]
    public void SetCustomerDetails_StoresNameEmailAndAddress()
    {
        var order = new Order();
        var customer = new CustomerDetails(
            Name: "Anna Andersson",
            Email: "anna@example.com",
            AddressLine1: "Storgatan 1",
            AddressLine2: null,
            PostalCode: "111 22",
            City: "Stockholm",
            Country: "SE");

        order.SetCustomerDetails(customer);

        Assert.Equal("Anna Andersson", order.CustomerName);
        Assert.Equal("anna@example.com", order.CustomerEmail);
        Assert.Equal("Storgatan 1", order.AddressLine1);
        Assert.Null(order.AddressLine2);
        Assert.Equal("111 22", order.PostalCode);
        Assert.Equal("Stockholm", order.City);
        Assert.Equal("SE", order.Country);
    }

    [Fact]
    public void Cancel_Pending_BecomesCancelled()
    {
        var order = new Order();

        order.Cancel();

        Assert.Equal(OrderStatus.Cancelled, order.Status);
    }

    [Fact]
    public void Cancel_Twice_StaysCancelled()
    {
        var order = new Order();
        order.Cancel();

        order.Cancel();

        Assert.Equal(OrderStatus.Cancelled, order.Status);
    }

    [Fact]
    public void MarkAsShipped_Paid_BecomesShipped()
    {
        var order = PaidOrder();
        Assert.True(order.CanBeShipped);

        order.MarkAsShipped();

        Assert.Equal(OrderStatus.Shipped, order.Status);
        // A shipped order can be neither shipped nor cancelled again.
        Assert.False(order.CanBeShipped);
        Assert.False(order.CanBeCancelledByAdmin);
    }

    [Fact]
    public void MarkAsShipped_NotPaid_Throws()
    {
        var order = UnpaidOrder();

        Assert.False(order.CanBeShipped);
        Assert.Throws<InvalidOperationException>(() => order.MarkAsShipped());
        Assert.Equal(OrderStatus.Pending, order.Status);
    }

    [Fact]
    public void MarkAsShipped_Cancelled_Throws()
    {
        var order = PaidOrder();
        order.CancelByAdmin();

        Assert.Throws<InvalidOperationException>(() => order.MarkAsShipped());
        Assert.Equal(OrderStatus.Cancelled, order.Status);
    }

    [Fact]
    public void CancelByAdmin_Paid_BecomesCancelledAndNeedsRefund()
    {
        var order = PaidOrder();
        Assert.True(order.CanBeCancelledByAdmin);
        Assert.False(order.NeedsRefund);

        order.CancelByAdmin();

        Assert.Equal(OrderStatus.Cancelled, order.Status);
        Assert.True(order.NeedsRefund);
    }

    [Fact]
    public void CancelByAdmin_NotPaid_Throws()
    {
        var order = UnpaidOrder();

        Assert.False(order.CanBeCancelledByAdmin);
        Assert.Throws<InvalidOperationException>(() => order.CancelByAdmin());
        Assert.Equal(OrderStatus.Pending, order.Status);
    }

    [Fact]
    public void CancelByAdmin_Shipped_Throws()
    {
        var order = PaidOrder();
        order.MarkAsShipped();

        Assert.Throws<InvalidOperationException>(() => order.CancelByAdmin());
        Assert.Equal(OrderStatus.Shipped, order.Status);
    }

    [Fact]
    public void CancelByAdmin_Twice_Throws()
    {
        // Unlike Cancel, which the webhook may call twice. Here a second cancel would put
        // the products back in stock twice, so it is refused.
        var order = PaidOrder();
        order.CancelByAdmin();

        Assert.Throws<InvalidOperationException>(() => order.CancelByAdmin());
    }

    // An order with one row and a payment that is not paid yet, as the checkout saves it.
    private static Order UnpaidOrder()
    {
        var order = new Order();
        order.AddItem(1, "Skål", 450m, 2);
        order.AddPayment("Stripe", "cs_test_123");
        return order;
    }

    // What the webhook does when the payment provider confirms the payment.
    private static Order PaidOrder()
    {
        var order = UnpaidOrder();
        order.Payment!.MarkAsPaid();
        return order;
    }
}
