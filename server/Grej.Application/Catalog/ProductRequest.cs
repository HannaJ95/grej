using System.ComponentModel.DataAnnotations;

namespace Grej.Application.Catalog;

// What the CMS form sends to create a product. The form checks the same rules, but the
// API never trusts the browser: invalid data gives 400 and nothing is saved (constraints.md).
public record ProductRequest
{
    // [Required] also stops a title with only spaces.
    [Required, MaxLength(200)]
    public required string Title { get; init; }

    // Optional. Nullable, since [ApiController] treats a non-nullable string as required.
    [MaxLength(4000)]
    public string? Description { get; init; }

    // Greater than 0 (constraints.md). Stripe cannot take more than 999 999,99 kr in one payment.
    [Range(0.01, 999_999.99)]
    public decimal Price { get; init; }

    [Range(0, 10_000)]
    public int Stock { get; init; }

    // False = a draft or a hidden product (ambiguity.md).
    public bool IsActive { get; init; }

    // Exactly one category (constraints.md). A missing id is 0, which gives 400 here.
    // An id that no category has gives 400 from AdminProductsController.
    [Range(1, int.MaxValue)]
    public int CategoryId { get; init; }

    // Several of each, or none (ambiguity.md). Left out of the JSON = none. An id that does
    // not exist gives 400 from AdminProductsController, like CategoryId.
    public IReadOnlyList<int> MaterialIds { get; init; } = [];
    public IReadOnlyList<int> ColorIds { get; init; } = [];
}

// What the CMS form sends to save changes: the same fields and rules, plus the
// stock the form showed when it was opened.
public record UpdateProductRequest : ProductRequest
{
    // If a customer has bought the product since then, the stock in the database is
    // different, and saving would undo the sale. The API then answers 409 instead.
    public int OriginalStock { get; init; }
}
