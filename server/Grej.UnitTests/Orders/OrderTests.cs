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
    public void SetShipping_AddsCostToTotalAndPayment()
    {
        var order = new Order();
        order.AddItem(1, "Skål", 450m, 2);

        order.SetShipping("Paket till ombud", 79m);
        order.AddPayment("Stripe", "cs_test_123");

        Assert.Equal("Paket till ombud", order.ShippingMethod);
        Assert.Equal(79m, order.ShippingCost);
        Assert.Equal(979m, order.Total);
        Assert.Equal(979m, order.Payment!.Amount);
    }

    [Fact]
    public void SetShipping_Twice_Throws()
    {
        var order = new Order();
        order.SetShipping("Paket till ombud", 79m);

        Assert.Throws<InvalidOperationException>(() => order.SetShipping("Paket till ombud", 79m));
        Assert.Equal(79m, order.Total);
    }

    [Fact]
    public void SetShipping_AfterPayment_Throws()
    {
        var order = UnpaidOrder();

        Assert.Throws<InvalidOperationException>(() => order.SetShipping("Paket till ombud", 79m));
        Assert.Null(order.ShippingCost);
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

    [Fact]
    public void CancelByAdmin_Refunded_BecomesCancelled()
    {
        // The admin refunded in Stripe before cancelling the order in the CMS.
        var order = PaidOrder();
        order.Payment!.MarkAsRefunded();
        Assert.True(order.NeedsCancelling);
        Assert.True(order.CanBeCancelledByAdmin);
        Assert.False(order.CanBeShipped);

        order.CancelByAdmin();

        Assert.Equal(OrderStatus.Cancelled, order.Status);
        Assert.False(order.NeedsCancelling);
        Assert.False(order.NeedsRefund);
    }

    [Fact]
    public void NeedsRefund_CancelledAndRefunded_IsFalse()
    {
        // The usual way: cancelled in the CMS first, then refunded in Stripe.
        var order = PaidOrder();
        order.CancelByAdmin();

        order.Payment!.MarkAsRefunded();

        Assert.False(order.NeedsRefund);
        Assert.False(order.NeedsCancelling);
    }

    [Fact]
    public void MarkAsOversold_Paid_NeedsAttentionAndCanStillBeShipped()
    {
        var order = PaidOrder();
        Assert.False(order.NeedsAttention);

        order.MarkAsOversold();

        Assert.True(order.IsOversold);
        Assert.True(order.NeedsAttention);
        // Only a warning: the admin may make one more and ship it (ambiguity.md).
        Assert.True(order.CanBeShipped);
    }

    [Fact]
    public void NeedsAttention_OversoldAndShipped_IsFalse()
    {
        var order = PaidOrder();
        order.MarkAsOversold();

        order.MarkAsShipped();

        Assert.False(order.NeedsAttention);
    }

    [Fact]
    public void NeedsAttention_OversoldAndCancelled_IsFalse()
    {
        var order = PaidOrder();
        order.MarkAsOversold();

        order.CancelByAdmin();

        Assert.False(order.NeedsAttention);
        Assert.True(order.NeedsRefund);
    }

    [Fact]
    public void NeedsAttention_OversoldAndRefunded_IsFalse()
    {
        var order = PaidOrder();
        order.MarkAsOversold();

        order.Payment!.MarkAsRefunded();

        Assert.False(order.NeedsAttention);
        Assert.True(order.NeedsCancelling);
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
