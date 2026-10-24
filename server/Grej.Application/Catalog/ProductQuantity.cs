namespace Grej.Application.Catalog;

// How many of a product, e.g. one row on a paid order. Catalog's own type, so
// Catalog does not need to know Orders' OrderItem (architecture.md).
public record ProductQuantity(int ProductId, int Quantity);
