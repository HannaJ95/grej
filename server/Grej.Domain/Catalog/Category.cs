namespace Grej.Domain.Catalog;

// A group of products in the shop, e.g. "Keramik". Every product belongs to exactly one
// category (constraints.md). Subcategories (a ParentId) are a Should in sprint 3.
public class Category
{
    public int Id { get; set; }
    public required string Name { get; set; }
}
