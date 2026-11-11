namespace Grej.Domain.Catalog;

public class Product
{
    // constraints.md
    public const int MaxImages = 10;

    // EF Core fills these by their names.
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

    // The packed parcel, for the shipping cost (Shipping).
    public int WeightGrams { get; set; }
    public int LengthCm { get; set; }
    public int WidthCm { get; set; }
    public int HeightCm { get; set; }

    // The item itself, shown in the shop. Null = not given.
    public decimal? ItemLengthCm { get; set; }
    public decimal? ItemWidthCm { get; set; }
    public decimal? ItemHeightCm { get; set; }
    public decimal? ItemDiameterCm { get; set; }
    public int? ItemWeightGrams { get; set; }

    public int CategoryId { get; set; }

    // Always the admin in this version (constraints.md). A string, like Identity's user ids.
    public string SellerId { get; set; } = "";

    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; private set; } = DateTime.UtcNow;

    // Sorted, since EF Core fills _images in no fixed order. The first is the main image.
    public IReadOnlyList<ProductImage> Images => _images.OrderBy(image => image.SortOrder).ToList();

    public ProductImage? MainImage => Images.FirstOrDefault();

    public bool HasRoomForImage => _images.Count < MaxImages;

    public IReadOnlyList<Material> Materials => _materials;
    public IReadOnlyList<Color> Colors => _colors;

    public bool IsSoldOut => Stock <= 0;

    public bool IsOversold => Stock < 0;

    public void DecreaseStock(int quantity)
    {
        if (quantity <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(quantity), "Quantity must be greater than 0.");
        }

        // No check against 0: a stock below 0 shows the double sale (constraints.md).
        Stock -= quantity;
        MarkAsUpdated();
    }

    public void IncreaseStock(int quantity)
    {
        if (quantity <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(quantity), "Quantity must be greater than 0.");
        }

        Stock += quantity;
        MarkAsUpdated();
    }

    // The caller checks HasRoomForImage before it uploads the file.
    public ProductImage AddImage(string url, string storagePath, string altText)
    {
        if (!HasRoomForImage)
        {
            throw new InvalidOperationException($"A product can have at most {MaxImages} images.");
        }

        // Not Count, since a removed image leaves a gap in the numbers.
        var sortOrder = _images.Count == 0 ? 0 : _images.Max(image => image.SortOrder) + 1;
        var image = new ProductImage(url, storagePath, altText, sortOrder);
        _images.Add(image);
        MarkAsUpdated();
        return image;
    }

    public bool RemoveImage(ProductImage image)
    {
        if (!_images.Remove(image))
        {
            return false;
        }

        MarkAsUpdated();
        return true;
    }

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

    // Public, since AdminProductService sets the admin's fields directly.
    public void MarkAsUpdated() => UpdatedAt = DateTime.UtcNow;
}
