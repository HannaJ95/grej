using System.ComponentModel.DataAnnotations;

namespace Grej.Application.Catalog;

// What the CMS form sends to create or rename a material or a color. The same rules as
// CategoryRequest, and 100 is the same limit as in MaterialConfiguration and ColorConfiguration.
public record PropertyRequest(
    [Required, MaxLength(100)] string Name);
