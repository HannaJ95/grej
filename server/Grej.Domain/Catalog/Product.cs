namespace Grej.Domain.Catalog;

// A product in the shop.
public class Product
{
    // The real list, like Order._items. Only this class can change it.
    private readonly List<ProductImage> _images = [];

    public int Id { get; set; }
    public required string Title { get; set; }
    public string Description { get; set; } = "";
    public decimal Price { get; set; }
    public string Currency { get; set; } = "SEK";
    public int Stock { get; set; }
    public bool IsActive { get; set; }

    // Exactly one category per product (constraints.md). The foreign key is in ProductConfiguration.
    public int CategoryId { get; set; }

    // The owner, always the admin in this version (constraints.md). A string, since that is
    // what Identity's user ids are. Set by AdminProductService when the product is created.
    public string SellerId { get; set; } = "";

    // Like Order and Payment. UpdatedAt changes in MarkAsUpdated.
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; private set; } = DateTime.UtcNow;

    // A list, so several images (Should) need no new table. At most one for now
    // (constraints.md), since SetImage replaces the image.
    public IReadOnlyList<ProductImage> Images => _images;

    // The image shown in the shop. Null if the product has no image.
    public ProductImage? MainImage => _images.MinBy(image => image.SortOrder);

    // Sold-out products are still shown, but cannot be bought (ambiguity.md).
    // Below 0 means the last item was sold twice (constraints.md).
    public bool IsSoldOut => Stock <= 0;

    // Called when an order with this product is paid (the webhook).
    public void DecreaseStock(int quantity)
    {
        if (quantity <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(quantity), "Quantity must be greater than 0.");
        }

        // No check against 0 on purpose: if two customers paid for the last item,
        // a stock below 0 shows the admin that one order must be refunded (constraints.md).
        Stock -= quantity;
        MarkAsUpdated();
    }

    // One image per product in this version (constraints.md), so a new image replaces
    // the old one. Returns the old image, so the caller can delete its file.
    public ProductImage? SetImage(string url, string storagePath, string altText)
    {
        var old = RemoveImage();
        _images.Add(new ProductImage(url, storagePath, altText, sortOrder: 0));
        MarkAsUpdated();
        return old;
    }

    // Returns the removed image, or null if the product had none.
    public ProductImage? RemoveImage()
    {
        var old = MainImage;
        _images.Clear();
        MarkAsUpdated();
        return old;
    }

    // The methods above call this themselves. The admin's fields (Title, Price ...) have
    // public setters, so AdminProductService calls it when it saves them.
    public void MarkAsUpdated() => UpdatedAt = DateTime.UtcNow;
}
