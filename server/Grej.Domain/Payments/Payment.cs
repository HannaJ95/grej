namespace Grej.Domain.Payments;

// A payment for an order. Stored separately from the order, with its provider
// and the provider's reference, so more payment methods can be added later
// without changing the order flow (constraints.md).
public class Payment
{
    public int Id { get; private set; }
    public int OrderId { get; private set; }
    public string Provider { get; private set; } = "";
    // For Stripe: the Checkout session id (cs_test_…). The webhook finds the payment by it.
    public string ProviderReference { get; private set; } = "";
    public PaymentStatus Status { get; private set; } = PaymentStatus.Pending;
    public decimal Amount { get; private set; }
    public string Currency { get; private set; } = "";
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; private set; } = DateTime.UtcNow;

    // Only Order creates payments (Order.AddPayment), so the amount always matches the order.
    internal Payment(string provider, string providerReference, decimal amount, string currency)
    {
        Provider = provider;
        ProviderReference = providerReference;
        Amount = amount;
        Currency = currency;
    }

    // Used by EF Core when it reads a row from the database.
    private Payment() { }
}
