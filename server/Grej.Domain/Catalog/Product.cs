namespace Grej.Domain.Catalog;

// A product in the shop. Category, seller, images and timestamps are added
// in sprint 2, when the CMS is built.
public class Product
{
    public int Id { get; set; }
    public required string Title { get; set; }
    public string Description { get; set; } = "";
    public decimal Price { get; set; }
    public string Currency { get; set; } = "SEK";
    public int Stock { get; set; }
    public bool IsActive { get; set; }

    // Sold-out products are still shown, but cannot be bought (ambiguity.md).
    // Below 0 means the last item was sold twice (constraints.md).
    public bool IsSoldOut => Stock <= 0;
}
