using Grej.Domain.Payments;

namespace Grej.Domain.Orders;

// An order created in the checkout. It starts as Pending, and its total is
// always the sum of its rows (constraints.md).
public class Order
{
    // The real list. Only this class can add to it; EF Core finds it by its name.
    private readonly List<OrderItem> _items = [];

    public int Id { get; private set; }
    public string OrderNumber { get; private set; } = NewOrderNumber();
    public OrderStatus Status { get; private set; } = OrderStatus.Pending;

    // Collected by the payment provider, so null until the order is paid.
    // Stripe Checkout only accepts Swedish addresses in this version (constraints.md).
    public string? CustomerName { get; private set; }
    public string? CustomerEmail { get; private set; }
    public string? AddressLine1 { get; private set; }
    public string? AddressLine2 { get; private set; }
    public string? PostalCode { get; private set; }
    public string? City { get; private set; }
    // Two-letter country code, always "SE" for now.
    public string? Country { get; private set; }

    public decimal Total { get; private set; }
    public string Currency { get; private set; } = "SEK";
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; private set; } = DateTime.UtcNow;

    // Read-only from the outside: rows can only be added through AddItem.
    public IReadOnlyList<OrderItem> Items => _items;

    // Null until the customer is sent to the payment provider.
    public Payment? Payment { get; private set; }

    // The admin can ship an order that is paid and not handled yet (constraints.md).
    public bool CanBeShipped => Status == OrderStatus.Pending && Payment?.Status == PaymentStatus.Paid;

    // The admin can only cancel a paid order (ambiguity.md). An unpaid one is cancelled
    // automatically when its payment expires, so a customer never pays for a cancelled order.
    public bool CanBeCancelledByAdmin => Status == OrderStatus.Pending && Payment?.Status == PaymentStatus.Paid;

    // Cancelled, but the customer's money has not been returned yet (constraints.md). False
    // again when the payment provider says the payment is Refunded.
    public bool NeedsRefund => Status == OrderStatus.Cancelled && Payment?.Status == PaymentStatus.Paid;

    public void AddItem(int productId, string title, decimal unitPrice, int quantity)
    {
        // Quantity comes from the browser, so it is never trusted (constraints.md).
        if (quantity <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(quantity), "Quantity must be greater than 0.");
        }

        _items.Add(new OrderItem(productId, title, unitPrice, quantity));
        Total += unitPrice * quantity;
    }

    public void AddPayment(string provider, string providerReference)
    {
        // One payment per order in this version; a new checkout creates a new order.
        if (Payment is not null)
        {
            throw new InvalidOperationException("The order already has a payment.");
        }

        Payment = new Payment(provider, providerReference, Total, Currency);
    }

    // Called by the webhook when the order is paid. The order is saved before the customer
    // reaches Stripe, so this is the first time we know who they are and where to ship.
    public void SetCustomerDetails(CustomerDetails customer)
    {
        CustomerName = customer.Name;
        CustomerEmail = customer.Email;
        AddressLine1 = customer.AddressLine1;
        AddressLine2 = customer.AddressLine2;
        PostalCode = customer.PostalCode;
        City = customer.City;
        Country = customer.Country;
        UpdatedAt = DateTime.UtcNow;
    }

    // Called by the webhook when the order's payment expires. The admin cancels
    // with CancelByAdmin, which has its own rule.
    public void Cancel()
    {
        // Already cancelled: nothing changes.
        if (Status == OrderStatus.Cancelled)
        {
            return;
        }

        // Only Pending → Cancelled is allowed (constraints.md).
        if (Status != OrderStatus.Pending)
        {
            throw new InvalidOperationException($"An order that is {Status} cannot be cancelled.");
        }

        Status = OrderStatus.Cancelled;
        UpdatedAt = DateTime.UtcNow;
    }

    // Called when the admin has sent the order (CMS).
    public void MarkAsShipped()
    {
        // AdminOrderService checks CanBeShipped first and answers 409, so this only
        // throws if some code forgets to check.
        if (!CanBeShipped)
        {
            throw new InvalidOperationException($"An order that is {Status} with payment {Payment?.Status} cannot be shipped.");
        }

        Status = OrderStatus.Shipped;
        UpdatedAt = DateTime.UtcNow;
    }

    // Called when the admin cancels the order in the CMS. The order was paid, so the
    // caller puts its products back in stock (constraints.md).
    public void CancelByAdmin()
    {
        // The same safety net as in MarkAsShipped.
        if (!CanBeCancelledByAdmin)
        {
            throw new InvalidOperationException($"An order that is {Status} with payment {Payment?.Status} cannot be cancelled by the admin.");
        }

        Cancel();
    }

    // E.g. GREJ-3F9A1C2B. Random instead of based on Id, since the Id is only set
    // when the order is saved, and the number is sent to Stripe before that.
    private static string NewOrderNumber() =>
        $"GREJ-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}";
}
