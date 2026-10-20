namespace Grej.Application.Catalog;

// Use cases for products in the shop.
public class ProductService(IProductRepository products)
{
    // Returns null if the product does not exist or is hidden (IsActive = false),
    // so a customer cannot tell a draft from a product that does not exist.
    public async Task<ProductDto?> GetProductAsync(int id, CancellationToken cancellationToken)
    {
        var product = await products.GetByIdAsync(id, cancellationToken);
        if (product is null || !product.IsActive)
        {
            return null;
        }

        return new ProductDto(
            product.Id,
            product.Title,
            product.Description,
            product.Price,
            product.Currency,
            product.IsSoldOut);
    }
}
