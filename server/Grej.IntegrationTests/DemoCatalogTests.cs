using System.ComponentModel.DataAnnotations;
using Grej.Application.Catalog;
using Grej.Domain.Catalog;
using Grej.Infrastructure.DemoData;

namespace Grej.IntegrationTests;

// Reads the real demo-catalog.json and images and checks them against the CMS's rules,
// so a typo in the file is found by `dotnet test` and not halfway through a reset-demo.
public class DemoCatalogTests
{
    // If the file is missing or has a misspelled field, Load throws and every test fails.
    private readonly DemoCatalog catalog = DemoCatalog.Load();

    [Fact]
    public void Products_FollowTheCmsRules()
    {
        var errors = new List<string>();
        foreach (var product in catalog.Categories.SelectMany(c => c.Products))
        {
            // Runs the same [Required], [MaxLength] and [Range] attributes that [ApiController]
            // checks when the CMS form sends a product. The category is set by the seed.
            var request = new ProductRequest
            {
                Title = product.Title,
                Description = product.Description,
                Price = product.Price,
                Stock = product.Stock,
                CategoryId = 1,
                Parcel = product.Parcel,
            };
            var results = new List<ValidationResult>();
            Validator.TryValidateObject(request, new ValidationContext(request), results, validateAllProperties: true);
            // Unlike [ApiController], Validator does not look inside the parcel by itself.
            Validator.TryValidateObject(request.Parcel, new ValidationContext(request.Parcel), results, validateAllProperties: true);
            errors.AddRange(results.Select(result => $"{product.Title}: {result.ErrorMessage}"));
        }

        // All errors at once, so one test run shows every mistake in the file.
        Assert.Empty(errors);
    }

    [Fact]
    public void ProductMaterialsAndColors_AreInTheLists()
    {
        var unknown = catalog.Categories
            .SelectMany(c => c.Products)
            .SelectMany(p => p.Materials.Except(catalog.Materials)
                .Concat(p.Colors.Except(catalog.Colors))
                .Select(name => $"{p.Title}: {name}"));

        Assert.Empty(unknown);
    }

    [Fact]
    public void ProductSubcategories_AreInTheirCategory()
    {
        var unknown = catalog.Categories
            .SelectMany(c => c.Products
                .Where(p => p.Subcategory is not null && !(c.Subcategories ?? []).Contains(p.Subcategory))
                .Select(p => $"{p.Title}: {p.Subcategory}"));

        Assert.Empty(unknown);
    }

    [Fact]
    public void Orders_HaveProductsFromTheCatalog()
    {
        var titles = catalog.Categories.SelectMany(c => c.Products).Select(p => p.Title).ToList();

        // The seed finds an order row's product by its title, so a title may only be used once.
        Assert.Distinct(titles);
        Assert.All(catalog.Orders, order =>
        {
            Assert.NotEmpty(order.Items);
            Assert.All(order.Items, item =>
            {
                Assert.Contains(item.Product, titles);
                // The same rule as Order.AddItem.
                Assert.True(item.Quantity > 0, $"{item.Product}: the quantity must be greater than 0.");
            });
            // Only Swedish addresses in this version (constraints.md).
            Assert.Equal("SE", order.Customer.Country);
        });
    }

    [Fact]
    public void Names_AreUniqueAndFitTheDatabase()
    {
        AssertNames(catalog.Materials);
        AssertNames(catalog.Colors);
        AssertNames(catalog.Categories.Select(c => c.Name).ToList());
        // The seed finds a subcategory by its main category and its name.
        Assert.All(catalog.Categories, c => AssertNames(c.Subcategories ?? []));
    }

    [Fact]
    public void Images_AreImagesTheCmsAccepts()
    {
        var categoryImages = catalog.Categories.Select(c => new DemoImage(c.Image, c.ImageAltText));
        var productImages = catalog.Categories.SelectMany(c => c.Products).SelectMany(p => p.Images ?? []);

        Assert.All(categoryImages.Concat(productImages), image =>
        {
            // Throws if the file is missing or is not a jpg, png or webp image of at most 5 MB.
            DemoCatalog.ReadImage(image.File);
            // The same rules as the alt text in AdminProductsController.AddImage, which trims it.
            Assert.InRange(image.AltText.Trim().Length, 1, 200);
        });
    }

    [Fact]
    public void Products_HaveAtMostTenImages()
    {
        Assert.All(catalog.Categories.SelectMany(c => c.Products), product =>
            Assert.True(
                (product.Images?.Count ?? 1) <= Product.MaxImages,
                $"{product.Title}: at most {Product.MaxImages} images."));
    }

    // The seed finds materials, colors and categories by name, so a name may only be used once.
    // 100 is the limit in the database and the CMS (CategoryRequest, PropertyRequest).
    private static void AssertNames(IReadOnlyList<string> names)
    {
        Assert.Distinct(names);
        Assert.All(names, name => Assert.InRange(name.Length, 1, 100));
    }
}
