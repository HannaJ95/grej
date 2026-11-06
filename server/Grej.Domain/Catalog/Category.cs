namespace Grej.Domain.Catalog;

// A group of products in the shop, e.g. "Keramik". Every product belongs to exactly one
// category (constraints.md). A category can have subcategories, e.g. Keramik → Skålar, but only
// one level: a subcategory cannot have its own (ambiguity.md).
public class Category
{
    public int Id { get; set; }
    public required string Name { get; set; }

    // The main category, or null if this is a main category itself.
    public int? ParentId { get; set; }
    public Category? Parent { get; set; }

    public bool IsSubcategory => ParentId is not null;
}
