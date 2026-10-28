using System.ComponentModel.DataAnnotations;

namespace Grej.Application.Catalog;

// What the CMS form sends to create or rename a category. [Required] also stops a name
// with only spaces, and 100 is the same limit as in CategoryConfiguration.
public record CategoryRequest(
    [Required, MaxLength(100)] string Name);
