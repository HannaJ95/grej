namespace Grej.Domain.Catalog;

// What a material and a color have in common. The admin creates them in the CMS, and a
// product can have several of each (ambiguity.md). Abstract, so it is never stored on its
// own: Material and Color get one table each.
public abstract class ProductProperty
{
    // Filled in by EF Core, like Product._images.
    private readonly List<Product> _products = [];

    public int Id { get; set; }

    // Not "required" like Category.Name, since AdminPropertyService creates them with new T(),
    // which C# does not allow for a class with required properties.
    public string Name { get; set; } = "";

    // The products that have this material or color. Used to count them in the database.
    public IReadOnlyList<Product> Products => _products;
}
