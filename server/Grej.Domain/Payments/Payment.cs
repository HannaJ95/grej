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

    // Called when the provider confirms the payment (webhook checkout.session.completed).
    // Returns true only when the payment changes to Paid, so the caller knows
    // whether the stock should be decreased.
    public bool MarkAsPaid()
    {
        // The same event may arrive twice (constraints.md). The second time changes nothing.
        if (Status == PaymentStatus.Paid)
        {
            return false;
        }

        // Only Pending → Paid is allowed (constraints.md).
        if (Status != PaymentStatus.Pending)
        {
            throw new InvalidOperationException($"A payment that is {Status} cannot be marked as paid.");
        }

        Status = PaymentStatus.Paid;
        UpdatedAt = DateTime.UtcNow;
        return true;
    }

    // Called when the customer never paid and the Checkout session ran out of time
    // (webhook checkout.session.expired). Returns true only when the payment changes
    // to Expired, so the caller knows whether the order should be cancelled.
    public bool MarkAsExpired()
    {
        // The same event may arrive twice (constraints.md). The second time changes nothing.
        if (Status == PaymentStatus.Expired)
        {
            return false;
        }

        // Only Pending → Expired is allowed (constraints.md).
        if (Status != PaymentStatus.Pending)
        {
            throw new InvalidOperationException($"A payment that is {Status} cannot be marked as expired.");
        }

        Status = PaymentStatus.Expired;
        UpdatedAt = DateTime.UtcNow;
        return true;
    }

    // Used by EF Core when it reads a row from the database.
    private Payment() { }
}
