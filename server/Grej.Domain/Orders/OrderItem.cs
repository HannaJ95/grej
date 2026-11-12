namespace Grej.Domain.Orders;

// Title and price are copied at purchase, so later product changes never change old orders.
public class OrderItem
{
    public int Id { get; private set; }
    public int OrderId { get; private set; }
    public int ProductId { get; private set; }
    public string TitleAtPurchase { get; private set; } = "";
    public decimal UnitPrice { get; private set; }
    public int Quantity { get; private set; }

    public decimal LineTotal => UnitPrice * Quantity;

    // Only Order.AddItem creates rows, so the total always matches.
    internal OrderItem(int productId, string titleAtPurchase, decimal unitPrice, int quantity)
    {
        ProductId = productId;
        TitleAtPurchase = titleAtPurchase;
        UnitPrice = unitPrice;
        Quantity = quantity;
    }

    // For EF Core.
    private OrderItem() { }
}
