namespace Grej.Domain.Catalog;

// A product in the shop.
public class Product
{
    // constraints.md
    public const int MaxImages = 10;

    // The real list, like Order._items. Only this class can change it.
    private readonly List<ProductImage> _images = [];
    private readonly List<Material> _materials = [];
    private readonly List<Color> _colors = [];

    public int Id { get; set; }
    public required string Title { get; set; }
    public string Description { get; set; } = "";
    public decimal Price { get; set; }
    public string Currency { get; set; } = "SEK";
    public int Stock { get; set; }
    public bool IsActive { get; set; }

    // The packed parcel, which the shipping cost is based on (Shipping).
    public int WeightGrams { get; set; }
    public int LengthCm { get; set; }
    public int WidthCm { get; set; }
    public int HeightCm { get; set; }

    // Exactly one category per product (constraints.md). The foreign key is in ProductConfiguration.
    public int CategoryId { get; set; }

    // The owner, always the admin in this version (constraints.md). A string, since that is
    // what Identity's user ids are. Set by AdminProductService when the product is created.
    public string SellerId { get; set; } = "";

    // Like Order and Payment. UpdatedAt changes in MarkAsUpdated.
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; private set; } = DateTime.UtcNow;

    // Sorted, since EF Core fills _images in no fixed order. The first is the main image.
    public IReadOnlyList<ProductImage> Images => _images.OrderBy(image => image.SortOrder).ToList();

    // The image in the shop's lists and the cart. Null if the product has no image.
    public ProductImage? MainImage => Images.FirstOrDefault();

    public bool HasRoomForImage => _images.Count < MaxImages;

    // Several of each, or none (ambiguity.md). Stored in the join tables ProductMaterials
    // and ProductColors (ProductConfiguration).
    public IReadOnlyList<Material> Materials => _materials;
    public IReadOnlyList<Color> Colors => _colors;

    // Sold-out products are still shown, but cannot be bought (ambiguity.md).
    public bool IsSoldOut => Stock <= 0;

    // The last item was sold twice (constraints.md).
    public bool IsOversold => Stock < 0;

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

    // Called when the admin cancels a paid order that was never shipped (constraints.md).
    public void IncreaseStock(int quantity)
    {
        // The same check as in DecreaseStock.
        if (quantity <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(quantity), "Quantity must be greater than 0.");
        }

        Stock += quantity;
        MarkAsUpdated();
    }

    // A new image goes last. The caller checks HasRoomForImage first, before it uploads the file.
    public ProductImage AddImage(string url, string storagePath, string altText)
    {
        if (!HasRoomForImage)
        {
            throw new InvalidOperationException($"A product can have at most {MaxImages} images.");
        }

        // One more than the highest, since a removed image leaves a gap in the numbers.
        var sortOrder = _images.Count == 0 ? 0 : _images.Max(image => image.SortOrder) + 1;
        var image = new ProductImage(url, storagePath, altText, sortOrder);
        _images.Add(image);
        MarkAsUpdated();
        return image;
    }

    // False if the image is not this product's. When the main image is removed, the next one
    // becomes the main image.
    public bool RemoveImage(ProductImage image)
    {
        if (!_images.Remove(image))
        {
            return false;
        }

        MarkAsUpdated();
        return true;
    }

    // E.g. after "Flytta upp" in the CMS. False, and nothing changed, unless the list has each
    // of the product's images exactly once.
    public bool OrderImages(IReadOnlyList<ProductImage> order)
    {
        if (order.Count != _images.Count
            || order.Distinct().Count() != order.Count
            || !order.All(_images.Contains))
        {
            return false;
        }

        for (var position = 0; position < order.Count; position++)
        {
            order[position].SortOrder = position;
        }
        MarkAsUpdated();
        return true;
    }

    // The CMS form always sends the whole choice, so the old list is replaced.
    public void SetMaterials(IEnumerable<Material> materials)
    {
        _materials.Clear();
        _materials.AddRange(materials);
        MarkAsUpdated();
    }

    public void SetColors(IEnumerable<Color> colors)
    {
        _colors.Clear();
        _colors.AddRange(colors);
        MarkAsUpdated();
    }

    // The methods above call this themselves. The admin's fields (Title, Price ...) have
    // public setters, so AdminProductService calls it when it saves them.
    public void MarkAsUpdated() => UpdatedAt = DateTime.UtcNow;
}
