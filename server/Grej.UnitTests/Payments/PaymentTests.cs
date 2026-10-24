using Grej.Domain.Orders;
using Grej.Domain.Payments;

namespace Grej.UnitTests.Payments;

public class PaymentTests
{
    [Fact]
    public void MarkAsPaid_Pending_BecomesPaidAndReturnsTrue()
    {
        var payment = NewPayment();

        var changed = payment.MarkAsPaid();

        Assert.True(changed);
        Assert.Equal(PaymentStatus.Paid, payment.Status);
    }

    [Fact]
    public void MarkAsPaid_Twice_StaysPaidAndReturnsFalse()
    {
        var payment = NewPayment();
        payment.MarkAsPaid();

        var changed = payment.MarkAsPaid();

        Assert.False(changed);
        Assert.Equal(PaymentStatus.Paid, payment.Status);
    }

    // Payments are only created through an order (Order.AddPayment).
    private static Payment NewPayment()
    {
        var order = new Order();
        order.AddItem(productId: 1, title: "Skål", unitPrice: 450m, quantity: 1);
        order.AddPayment("Stripe", "cs_test_123");
        return order.Payment!;
    }
}
