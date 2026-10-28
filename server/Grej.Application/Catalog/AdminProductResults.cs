namespace Grej.Application.Catalog;

// How AdminProductService.UpdateAsync ended.
public enum UpdateProductResult
{
    Updated,
    NotFound,
    // A customer has bought the product since the admin opened the form.
    StockChanged,
    // No category has the id in the request.
    CategoryNotFound,
}

// How AdminProductService.DeleteAsync ended.
public enum DeleteProductResult
{
    Deleted,
    NotFound,
    // The product is on an order, so it can only be hidden (constraints.md).
    OnOrder,
}
