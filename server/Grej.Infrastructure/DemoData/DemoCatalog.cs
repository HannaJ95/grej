using System.Text.Json;
using System.Text.Json.Serialization;
using Grej.Application.Catalog;
using Grej.Domain.Orders;

namespace Grej.Infrastructure.DemoData;

// The demo shop's content, which `reset-demo` fills the database with. It is kept in
// demo-catalog.json, so the texts can be changed without touching the code.
public record DemoCatalog(
    IReadOnlyList<string> Materials,
    IReadOnlyList<string> Colors,
    IReadOnlyList<DemoCategory> Categories,
    IReadOnlyList<DemoOrder> Orders)
{
    // The csproj copies the DemoData folder next to the built program (bin/...), so the
    // files are found wherever the program is started from.
    private static readonly string Folder = Path.Combine(AppContext.BaseDirectory, "DemoData");

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        // A misspelled, missing or null field stops the load, instead of quietly becoming
        // null or 0. DemoCatalogTests loads the file, so `dotnet test` finds such a typo.
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

    // Reads e.g. "keramik.jpg" from DemoData/Images, with the same check as an upload in the CMS.
    public static ImageFile ReadImage(string fileName)
    {
        var content = File.ReadAllBytes(Path.Combine(Folder, "Images", fileName));
        return ImageFile.FromBytes(content)
            ?? throw new InvalidOperationException($"{fileName} is not a jpg, png or webp image of at most 5 MB.");
    }
}

// A main category and its products. For now, every product in it gets a copy of the same image.
// Subcategories is optional: the names of its subcategories, which the products can choose.
public record DemoCategory(
    string Name,
    string Image,
    string ImageAltText,
    IReadOnlyList<DemoProduct> Products,
    IReadOnlyList<string>? Subcategories = null);

// The same fields as the CMS form (ProductRequest), but the subcategory, the materials and the
// colors are given by name, since their ids are not known until the seed has saved them.
public record DemoProduct(
    string Title,
    string Description,
    decimal Price,
    int Stock,
    bool IsActive,
    IReadOnlyList<string> Materials,
    IReadOnlyList<string> Colors,
    // One of its category's Subcategories, or null when the product is in the main category.
    string? Subcategory = null);

// An order in the demo shop, paid DaysAgo days ago and then handled as Status says. The stock
// in the file is what is left after these orders, so the seed does not change it. The customer
// is the same record the webhook gets from Stripe.
public record DemoOrder(
    int DaysAgo,
    DemoOrderStatus Status,
    CustomerDetails Customer,
    IReadOnlyList<DemoOrderItem> Items);

// The product is given by its title, since its id is not known until the seed has saved it.
public record DemoOrderItem(string Product, int Quantity);

// Read from the file as text, e.g. "ToShip", instead of a number. Upper and lower case do not
// matter, but an unknown value stops the load.
[JsonConverter(typeof(JsonStringEnumConverter<DemoOrderStatus>))]
public enum DemoOrderStatus
{
    // Paid, waiting to be shipped.
    ToShip,
    Shipped,
    // Cancelled by the admin after it was paid (Order.NeedsRefund).
    NeedsRefund,
}
