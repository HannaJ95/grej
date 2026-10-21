namespace Grej.Domain.Orders;

// One row on an order. Title and price are copied from the product at the time
// of purchase, so later changes to the product never change old orders.
public class OrderItem
{
    public int Id { get; private set; }
    public int OrderId { get; private set; }
    public int ProductId { get; private set; }
    public string TitleAtPurchase { get; private set; } = "";
    public decimal UnitPrice { get; private set; }
    public int Quantity { get; private set; }

    // Only Order creates order rows (Order.AddItem), so the total always matches.
    internal OrderItem(int productId, string titleAtPurchase, decimal unitPrice, int quantity)
    {
        ProductId = productId;
        TitleAtPurchase = titleAtPurchase;
        UnitPrice = unitPrice;
        Quantity = quantity;
    }

    // Used by EF Core when it reads a row from the database.
    private OrderItem() { }
}
