using System.Text.Json;
using System.Text.Json.Serialization;
using Grej.Application.Catalog;
using Grej.Domain.Orders;

namespace Grej.Infrastructure.DemoData;

// reset-demo's content. In a json file, so the texts can change without touching the code.
public record DemoCatalog(
    IReadOnlyList<string> Materials,
    IReadOnlyList<string> Colors,
    IReadOnlyList<DemoCategory> Categories,
    IReadOnlyList<DemoOrder> Orders)
{
    // The csproj copies DemoData next to the built program, so it is found from any folder.
    private static readonly string Folder = Path.Combine(AppContext.BaseDirectory, "DemoData");

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        // A misspelled, missing or null field stops the load instead of becoming null or 0.
        // DemoCatalogTests loads the file, so `dotnet test` finds a typo.
        UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow,
        RespectRequiredConstructorParameters = true,
        RespectNullableAnnotations = true,
    };

    public static DemoCatalog Load()
    {
        var json = File.ReadAllText(Path.Combine(Folder, "demo-catalog.json"));
        return JsonSerializer.Deserialize<DemoCatalog>(json, JsonOptions)
            ?? throw new InvalidOperationException("demo-catalog.json is empty.");
    }

    // The same check as an upload in the CMS.
    public static ImageFile ReadImage(string fileName)
    {
        var content = File.ReadAllBytes(Path.Combine(Folder, "Images", fileName));
        return ImageFile.FromBytes(content)
            ?? throw new InvalidOperationException($"{fileName} is not a jpg, png or webp image of at most 5 MB.");
    }
}

// Image is for the products without images of their own.
public record DemoCategory(
    string Name,
    string Image,
    string ImageAltText,
    IReadOnlyList<DemoProduct> Products,
    IReadOnlyList<string>? Subcategories = null)
{
    public IReadOnlyList<DemoImage> ImagesOf(DemoProduct product) =>
        product.Images ?? [new DemoImage(Image, ImageAltText)];
}

// Like ProductRequest, but the subcategory, materials and colors by name, since their ids do not
// exist until the seed has saved them.
public record DemoProduct(
    string Title,
    string Description,
    decimal Price,
    int Stock,
    bool IsActive,
    IReadOnlyList<string> Materials,
    IReadOnlyList<string> Colors,
    ParcelRequest Parcel,
    ProductSizeRequest? Size = null,
    // Null = in the main category.
    string? Subcategory = null,
    // The main image first. Null = a copy of the category's image.
    IReadOnlyList<DemoImage>? Images = null);

// A file in DemoData/Images.
public record DemoImage(string File, string AltText);

// The stock in the file is what is left after these orders, so the seed does not change it.
public record DemoOrder(
    int DaysAgo,
    DemoOrderStatus Status,
    CustomerDetails Customer,
    IReadOnlyList<DemoOrderItem> Items);

// The product is given by its title, since its id is not known until the seed has saved it.
public record DemoOrderItem(string Product, int Quantity);

// Text in the file, e.g. "ToShip". An unknown value stops the load.
[JsonConverter(typeof(JsonStringEnumConverter<DemoOrderStatus>))]
public enum DemoOrderStatus
{
    ToShip,
    Shipped,
    // Cancelled by the admin after it was paid (Order.NeedsRefund).
    NeedsRefund,
}
