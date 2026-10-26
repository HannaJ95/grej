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

    // Called by the webhook when the order's payment expires. The admin will
    // also cancel orders in the CMS (sprint 3).
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

    // E.g. GREJ-3F9A1C2B. Random instead of based on Id, since the Id is only set
    // when the order is saved, and the number is sent to Stripe before that.
    private static string NewOrderNumber() =>
        $"GREJ-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}";
}
