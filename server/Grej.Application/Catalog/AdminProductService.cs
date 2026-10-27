using Grej.Application.Common;
using Grej.Application.Orders;
using Grej.Domain.Catalog;

namespace Grej.Application.Catalog;

// Use cases for products in the CMS. Unlike ProductService, which is for the shop,
// the admin sees every product, hidden ones too. Only admin endpoints use it.
public class AdminProductService(IProductRepository products, OrderService orders)
{
    // One page of all products, newest first.
    public async Task<PagedResult<AdminProductDto>> GetProductsAsync(ProductListQuery query, CancellationToken cancellationToken)
    {
        var page = await products.GetPageAsync(query.Page, query.PageSize, cancellationToken);

        return new PagedResult<AdminProductDto>(
            page.Items.Select(ToDto).ToList(),
            page.Page,
            page.PageSize,
            page.TotalCount);
    }

    // Null if no product has this id. Hidden products are included.
    public async Task<AdminProductDto?> GetProductAsync(int id, CancellationToken cancellationToken)
    {
        var product = await products.GetByIdAsync(id, cancellationToken);
        return product is null ? null : ToDto(product);
    }

    public async Task<AdminProductDto> CreateAsync(ProductRequest request, CancellationToken cancellationToken)
    {
        // Title is required when a Product is created. Apply then sets every field.
        var product = new Product { Title = request.Title };
        Apply(request, product);

        products.Add(product);
        await products.SaveChangesAsync(cancellationToken);

        // The database has given the product its id now.
        return ToDto(product);
    }

    public async Task<UpdateProductResult> UpdateAsync(int id, UpdateProductRequest request, CancellationToken cancellationToken)
    {
        var product = await products.GetByIdAsync(id, cancellationToken);
        if (product is null)
        {
            return UpdateProductResult.NotFound;
        }

        // The stock has changed since the form was opened, e.g. a customer has paid.
        // Saving the form's stock would undo that sale, so nothing is saved. (A sale in the
        // milliseconds between here and SaveChangesAsync makes it throw instead, since
        // Stock is a concurrency token in ProductConfiguration.)
        if (product.Stock != request.OriginalStock)
        {
            return UpdateProductResult.StockChanged;
        }

        Apply(request, product);
        await products.SaveChangesAsync(cancellationToken);
        return UpdateProductResult.Updated;
    }

    public async Task<DeleteProductResult> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var product = await products.GetByIdAsync(id, cancellationToken);
        if (product is null)
        {
            return DeleteProductResult.NotFound;
        }

        // Old orders point to their products, so an ordered product is never hard
        // deleted; the admin hides it instead (constraints.md). Asked through the Orders
        // module's service, not its tables. The foreign key in OrderItemConfiguration
        // also stops the delete if an order is created right now.
        if (await orders.IsProductOrderedAsync(id, cancellationToken))
        {
            return DeleteProductResult.OnOrder;
        }

        products.Remove(product);
        await products.SaveChangesAsync(cancellationToken);
        return DeleteProductResult.Deleted;
    }

    // Copies the form's fields to the product. Used by both create and update.
    private static void Apply(ProductRequest request, Product product)
    {
        product.Title = request.Title.Trim();
        product.Description = request.Description?.Trim() ?? "";
        product.Price = request.Price;
        product.Stock = request.Stock;
        product.IsActive = request.IsActive;
    }

    private static AdminProductDto ToDto(Product product) => new(
        product.Id,
        product.Title,
        product.Description,
        product.Price,
        product.Currency,
        product.Stock,
        product.IsActive);
}
