using System.Text.Json;
using System.Text.Json.Serialization;
using Grej.Application.Catalog;

namespace Grej.Infrastructure.DemoData;

// The demo shop's content, which `reset-demo` fills the database with. It is kept in
// demo-catalog.json, so the texts can be changed without touching the code.
public record DemoCatalog(
    IReadOnlyList<string> Materials,
    IReadOnlyList<string> Colors,
    IReadOnlyList<DemoCategory> Categories)
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

// A category and its products. For now, every product in it gets a copy of the same image.
public record DemoCategory(
    string Name,
    string Image,
    string ImageAltText,
    IReadOnlyList<DemoProduct> Products);

// The same fields as the CMS form (ProductRequest), but materials and colors are given by
// name, since their ids are not known until the seed has saved them.
public record DemoProduct(
    string Title,
    string Description,
    decimal Price,
    int Stock,
    bool IsActive,
    IReadOnlyList<string> Materials,
    IReadOnlyList<string> Colors);
