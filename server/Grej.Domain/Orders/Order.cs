using Grej.Domain.Payments;

namespace Grej.Domain.Orders;

public class Order
{
    // EF Core fills this backing field by its name.
    private readonly List<OrderItem> _items = [];

    public int Id { get; private set; }
    public string OrderNumber { get; private set; } = NewOrderNumber();
    public OrderStatus Status { get; private set; } = OrderStatus.Pending;

    // Paid after another customer had bought the last item (ambiguity.md).
    public bool IsOversold { get; private set; }

    // Null until the order is paid, since Stripe Checkout collects them.
    public string? CustomerName { get; private set; }
    public string? CustomerEmail { get; private set; }
    public string? AddressLine1 { get; private set; }
    public string? AddressLine2 { get; private set; }
    public string? PostalCode { get; private set; }
    public string? City { get; private set; }
    // Two-letter country code, always "SE" for now.
    public string? Country { get; private set; }

    // Null on orders from before shipping was built.
    public string? ShippingMethod { get; private set; }
    public decimal? ShippingCost { get; private set; }

    public decimal Total { get; private set; }
    public string Currency { get; private set; } = "SEK";
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; private set; } = DateTime.UtcNow;

    public IReadOnlyList<OrderItem> Items => _items;

    // Null until the customer is sent to the payment provider.
    public Payment? Payment { get; private set; }

    public bool CanBeShipped => Status == OrderStatus.Pending && Payment?.Status == PaymentStatus.Paid;

    // Not unpaid ones, since the customer can still pay for them (ambiguity.md). Refunded
    // ones, in case the admin refunded in Stripe first.
    public bool CanBeCancelledByAdmin =>
        Status == OrderStatus.Pending && (Payment?.Status is PaymentStatus.Paid or PaymentStatus.Refunded);

    public bool NeedsRefund => Status == OrderStatus.Cancelled && Payment?.Status == PaymentStatus.Paid;

    // Refunded in Stripe first, so its products are not back in stock yet.
    public bool NeedsCancelling => Status == OrderStatus.Pending && Payment?.Status == PaymentStatus.Refunded;

    // After a cancel or a refund, NeedsRefund or NeedsCancelling takes over.
    public bool NeedsAttention => IsOversold && CanBeShipped;

    public void AddItem(int productId, string title, decimal unitPrice, int quantity)
    {
        // The quantity comes from the browser (constraints.md).
        if (quantity <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(quantity), "Quantity must be greater than 0.");
        }

        _items.Add(new OrderItem(productId, title, unitPrice, quantity));
        Total += unitPrice * quantity;
    }

    // After the rows, which the cost depends on, and before the payment, whose amount is the total.
    public void SetShipping(string method, decimal cost)
    {
        if (Payment is not null)
        {
            throw new InvalidOperationException("The shipping cannot change once the order has a payment.");
        }

        if (ShippingMethod is not null)
        {
            throw new InvalidOperationException("The order already has shipping.");
        }

        ShippingMethod = method;
        ShippingCost = cost;
        Total += cost;
    }

    public void AddPayment(string provider, string providerReference)
    {
        // A new checkout creates a new order.
        if (Payment is not null)
        {
            throw new InvalidOperationException("The order already has a payment.");
        }

        Payment = new Payment(provider, providerReference, Total, Currency);
    }

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

    public void MarkAsOversold()
    {
        IsOversold = true;
        UpdatedAt = DateTime.UtcNow;
    }

    // When the payment expires. The admin uses CancelByAdmin, which has its own rule.
    public void Cancel()
    {
        if (Status == OrderStatus.Cancelled)
        {
            return;
        }

        if (Status != OrderStatus.Pending)
        {
            throw new InvalidOperationException($"An order that is {Status} cannot be cancelled.");
        }

        Status = OrderStatus.Cancelled;
        UpdatedAt = DateTime.UtcNow;
    }

    public void MarkAsShipped()
    {
        // AdminOrderService checks first and answers 409, so this is only a safety net.
        if (!CanBeShipped)
        {
            throw new InvalidOperationException($"An order that is {Status} with payment {Payment?.Status} cannot be shipped.");
        }

        Status = OrderStatus.Shipped;
        UpdatedAt = DateTime.UtcNow;
    }

    // The caller puts the products back in stock (constraints.md).
    public void CancelByAdmin()
    {
        if (!CanBeCancelledByAdmin)
        {
            throw new InvalidOperationException($"An order that is {Status} with payment {Payment?.Status} cannot be cancelled by the admin.");
        }

        Cancel();
    }

    // Random, since the Id is set when the order is saved, and the number goes to Stripe before that.
    private static string NewOrderNumber() =>
        $"GREJ-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}";
}
