using Grej.Application.Common;
using Grej.Domain.Catalog;

namespace Grej.Application.Catalog;

// Use cases for categories in the CMS. Only admin endpoints use it.
public class AdminCategoryService(ICategoryRepository categories, IProductRepository products)
{
    // One page of categories, sorted by name.
    public async Task<PagedResult<CategoryDto>> GetCategoriesAsync(CategoryListQuery query, CancellationToken cancellationToken)
    {
        var page = await categories.GetPageAsync(query.Page, query.PageSize, cancellationToken);

        return new PagedResult<CategoryDto>(
            page.Items.Select(ToDto).ToList(),
            page.Page,
            page.PageSize,
            page.TotalCount);
    }

    // Null if no category has this id.
    public async Task<CategoryDto?> GetCategoryAsync(int id, CancellationToken cancellationToken)
    {
        var category = await categories.GetByIdAsync(id, cancellationToken);
        return category is null ? null : ToDto(category);
    }

    public async Task<CategoryDto> CreateAsync(CategoryRequest request, CancellationToken cancellationToken)
    {
        var category = new Category { Name = request.Name.Trim() };

        categories.Add(category);
        await categories.SaveChangesAsync(cancellationToken);

        // The database has given the category its id now.
        return ToDto(category);
    }

    // False if no category has this id.
    public async Task<bool> UpdateAsync(int id, CategoryRequest request, CancellationToken cancellationToken)
    {
        var category = await categories.GetByIdAsync(id, cancellationToken);
        if (category is null)
        {
            return false;
        }

        category.Name = request.Name.Trim();
        await categories.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<DeleteCategoryResult> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var category = await categories.GetByIdAsync(id, cancellationToken);
        if (category is null)
        {
            return DeleteCategoryResult.NotFound;
        }

        // A product must always have a category, so the admin moves its products first
        // (ambiguity.md). Products and categories are both in the Catalog module, so the
        // product repository is asked directly. The foreign key in ProductConfiguration also
        // stops the delete if a product is saved into the category right now.
        if (await products.AnyInCategoryAsync(id, cancellationToken))
        {
            return DeleteCategoryResult.HasProducts;
        }

        categories.Remove(category);
        await categories.SaveChangesAsync(cancellationToken);
        return DeleteCategoryResult.Deleted;
    }

    private static CategoryDto ToDto(Category category) => new(category.Id, category.Name);
}
