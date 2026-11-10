using System.ComponentModel.DataAnnotations;
using Grej.Domain.Catalog;

namespace Grej.Application.Catalog;

// What the CMS sends when the admin moves an image: every image id of the product, in the new
// order. Ids that are not exactly the product's images give 400 from AdminProductsController.
public record ImageOrderRequest(
    [Required, MaxLength(Product.MaxImages)] IReadOnlyList<int> ImageIds);
