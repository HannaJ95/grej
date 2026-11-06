using Grej.Application.Common;
using Grej.Domain.Catalog;

namespace Grej.Application.Catalog;

// Use cases for categories in the CMS. Only admin endpoints use it.
public class AdminCategoryService(ICategoryRepository categories, IProductRepository products)
{
    // One page of categories: each main category followed by its subcategories.
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

    // Null if the request's ParentId is not a main category; nothing is saved then.
    public async Task<CategoryDto?> CreateAsync(CategoryRequest request, CancellationToken cancellationToken)
    {
        var parent = await FindMainCategoryAsync(request.ParentId, cancellationToken);
        if (request.ParentId is not null && parent is null)
        {
            return null;
        }

        var category = new Category { Name = request.Name.Trim(), ParentId = parent?.Id, Parent = parent };

        categories.Add(category);
        await categories.SaveChangesAsync(cancellationToken);

        // The database has given the category its id now.
        return ToDto(category);
    }

    public async Task<UpdateCategoryResult> UpdateAsync(int id, CategoryRequest request, CancellationToken cancellationToken)
    {
        var category = await categories.GetByIdAsync(id, cancellationToken);
        if (category is null)
        {
            return UpdateCategoryResult.NotFound;
        }

        var parent = await FindMainCategoryAsync(request.ParentId, cancellationToken);
        if (request.ParentId is not null)
        {
            // Only one level (ambiguity.md): the main category must exist, must not be this
            // category, and a category with subcategories cannot become a subcategory itself.
            if (parent is null
                || parent.Id == id
                || await categories.HasSubcategoriesAsync(id, cancellationToken))
            {
                return UpdateCategoryResult.InvalidParent;
            }
        }

        category.Name = request.Name.Trim();
        // Both are set, so EF Core sees the change also when a subcategory becomes a main category.
        category.ParentId = parent?.Id;
        category.Parent = parent;
        await categories.SaveChangesAsync(cancellationToken);
        return UpdateCategoryResult.Updated;
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

        // The subcategories are deleted first, so nothing disappears by accident. The foreign key
        // in CategoryConfiguration also stops it.
        if (await categories.HasSubcategoriesAsync(id, cancellationToken))
        {
            return DeleteCategoryResult.HasSubcategories;
        }

        categories.Remove(category);
        await categories.SaveChangesAsync(cancellationToken);
        return DeleteCategoryResult.Deleted;
    }

    // The main category with this id. Null if the id is null, or if it does not belong to a
    // main category (no category has it, or it is a subcategory).
    private async Task<Category?> FindMainCategoryAsync(int? id, CancellationToken cancellationToken)
    {
        if (id is null)
        {
            return null;
        }

        var category = await categories.GetByIdAsync(id.Value, cancellationToken);
        return category is not null && !category.IsSubcategory ? category : null;
    }

    private static CategoryDto ToDto(Category category) =>
        new(category.Id, category.Name, category.ParentId, category.Parent?.Name);
}
