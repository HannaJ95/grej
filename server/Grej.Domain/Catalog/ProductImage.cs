namespace Grej.Domain.Catalog;

// An image of a product. The file is in Supabase Storage; the database only
// stores where it is.
public class ProductImage
{
    public int Id { get; private set; }
    public int ProductId { get; private set; }

    // The public address the browser loads the image from.
    public string Url { get; private set; } = "";

    // Where the file is in the storage, used to delete it.
    public string StoragePath { get; private set; } = "";

    public string AltText { get; private set; } = "";

    // The image with the lowest number is the main image. Always 0 while a
    // product has one image.
    public int SortOrder { get; private set; }

    // Only Product creates images (Product.SetImage), like OrderItem and Order.AddItem.
    internal ProductImage(string url, string storagePath, string altText, int sortOrder)
    {
        Url = url;
        StoragePath = storagePath;
        AltText = altText;
        SortOrder = sortOrder;
    }

    // Used by EF Core when it reads a row from the database.
    private ProductImage() { }
}
