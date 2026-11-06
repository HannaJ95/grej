using System.ComponentModel.DataAnnotations;

namespace Grej.Application.Catalog;

// What the CMS form sends to create or change a category. [Required] also stops a name
// with only spaces, and 100 is the same limit as in CategoryConfiguration. ParentId is the
// main category for a subcategory, or null for a main category.
public record CategoryRequest(
    [Required, MaxLength(100)] string Name,
    int? ParentId = null);
