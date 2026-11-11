using System.ComponentModel.DataAnnotations;

namespace Grej.Application.Catalog;

// The CMS form checks the same rules, but the API never trusts the browser (constraints.md).
public record ProductRequest
{
    // [Required] also stops a title with only spaces.
    [Required, MaxLength(200)]
    public required string Title { get; init; }

    // Optional. Nullable, since [ApiController] treats a non-nullable string as required.
    [MaxLength(4000)]
    public string? Description { get; init; }

    // Stripe takes at most 999 999,99 kr in one payment.
    [Range(0.01, 999_999.99)]
    public decimal Price { get; init; }

    [Range(0, 10_000)]
    public int Stock { get; init; }

    // False = a draft or a hidden product (ambiguity.md).
    public bool IsActive { get; init; }

    // A missing id is 0. An unknown id gives 400 from AdminProductsController.
    [Range(1, int.MaxValue)]
    public int CategoryId { get; init; }

    // Left out of the JSON = none. An unknown id gives 400, like CategoryId.
    public IReadOnlyList<int> MaterialIds { get; init; } = [];
    public IReadOnlyList<int> ColorIds { get; init; } = [];

    // The checkout calculates the shipping from it.
    [Required]
    public required ParcelRequest Parcel { get; init; }

    // Left out of the JSON = no size, like MaterialIds.
    public ProductSizeRequest Size { get; init; } = new();
}

// Saving changes also sends the stock the form showed when it was opened.
public record UpdateProductRequest : ProductRequest
{
    // A sale since then would be undone, so the API answers 409 instead.
    public int OriginalStock { get; init; }
}
