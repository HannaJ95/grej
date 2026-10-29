using Grej.Application.Common;
using Grej.Application.Orders;
using Grej.Domain.Catalog;

namespace Grej.Application.Catalog;

// Use cases for products in the CMS. Unlike ProductService, which is for the shop,
// the admin sees every product, hidden ones too. Only admin endpoints use it.
public class AdminProductService(
    IProductRepository products,
    ICategoryRepository categories,
    IPropertyRepository<Material> materials,
    IPropertyRepository<Color> colors,
    OrderService orders,
    IImageStorage images)
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

    // sellerId is the logged-in admin, who becomes the product's owner. Null if the category,
    // a material or a color in the request does not exist; nothing is saved then.
    public async Task<AdminProductDto?> CreateAsync(ProductRequest request, string sellerId, CancellationToken cancellationToken)
    {
        // Title is required when a Product is created. TryApplyAsync then sets every other field.
        // The owner is only set here, so editing a product never changes it.
        var product = new Product { Title = request.Title, SellerId = sellerId };
        if (!await TryApplyAsync(request, product, cancellationToken))
        {
            return null;
        }

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

        // E.g. a category or a color deleted after the form was opened, or an id sent from
        // outside the form.
        if (!await TryApplyAsync(request, product, cancellationToken))
        {
            return UpdateProductResult.ChoiceNotFound;
        }

        product.MarkAsUpdated();
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

        // Read before the delete, while the product still has its images.
        var imagePaths = product.Images.Select(image => image.StoragePath).ToList();

        products.Remove(product);
        await products.SaveChangesAsync(cancellationToken);

        // The database has deleted the image rows (cascade), but not the files.
        foreach (var path in imagePaths)
        {
            await images.DeleteAsync(path, cancellationToken);
        }

        return DeleteProductResult.Deleted;
    }

    // Replaces the product's image. Null if no product has this id.
    public async Task<ProductImageDto?> SetImageAsync(int id, ImageFile file, string altText, CancellationToken cancellationToken)
    {
        var product = await products.GetByIdAsync(id, cancellationToken);
        if (product is null)
        {
            return null;
        }

        // A new name for every upload, so a browser or Supabase's cache never shows an old
        // image at the same address. The extension comes from the file's content, not its name.
        var path = $"products/{product.Id}/{Guid.NewGuid():N}{file.Extension}";

        // Upload first, save after. If the save fails, the new file is only unused, but the
        // database never points to a file that does not exist (like the checkout in architecture.md).
        var url = await images.UploadAsync(path, file, cancellationToken);
        var old = product.SetImage(url, path, altText.Trim());
        await products.SaveChangesAsync(cancellationToken);

        // Last, when nothing points to the old file any more.
        if (old is not null)
        {
            await images.DeleteAsync(old.StoragePath, cancellationToken);
        }

        return ProductImageDto.From(product.MainImage);
    }

    // False if no product has this id. A product without an image is fine: nothing to remove.
    public async Task<bool> RemoveImageAsync(int id, CancellationToken cancellationToken)
    {
        var product = await products.GetByIdAsync(id, cancellationToken);
        if (product is null)
        {
            return false;
        }

        var removed = product.RemoveImage();
        if (removed is not null)
        {
            // The row first, then the file, as in SetImageAsync.
            await products.SaveChangesAsync(cancellationToken);
            await images.DeleteAsync(removed.StoragePath, cancellationToken);
        }

        return true;
    }

    // Copies the form's fields to the product. Used by both create and update. False if the
    // category, a material or a color does not exist; the product is not changed then.
    // "Try" as in int.TryParse: it answers with true or false instead of throwing.
    private async Task<bool> TryApplyAsync(ProductRequest request, Product product, CancellationToken cancellationToken)
    {
        if (!await categories.ExistsAsync(request.CategoryId, cancellationToken))
        {
            return false;
        }

        // GetByIdsAsync skips ids that do not exist, so fewer rows than ids means one is missing.
        // Distinct, since the same id sent twice is still only one row.
        var chosenMaterials = await materials.GetByIdsAsync(request.MaterialIds, cancellationToken);
        var chosenColors = await colors.GetByIdsAsync(request.ColorIds, cancellationToken);
        if (chosenMaterials.Count != request.MaterialIds.Distinct().Count()
            || chosenColors.Count != request.ColorIds.Distinct().Count())
        {
            return false;
        }

        product.Title = request.Title.Trim();
        product.Description = request.Description?.Trim() ?? "";
        product.Price = request.Price;
        product.Stock = request.Stock;
        product.IsActive = request.IsActive;
        product.CategoryId = request.CategoryId;
        product.SetMaterials(chosenMaterials);
        product.SetColors(chosenColors);
        return true;
    }

    private static AdminProductDto ToDto(Product product) => new(
        product.Id,
        product.Title,
        product.Description,
        product.Price,
        product.Currency,
        product.Stock,
        product.IsActive,
        product.CategoryId,
        product.Materials.Select(material => material.Id).ToList(),
        product.Colors.Select(color => color.Id).ToList(),
        ProductImageDto.From(product.MainImage));
}
