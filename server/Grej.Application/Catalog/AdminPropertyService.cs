using Grej.Application.Common;
using Grej.Domain.Catalog;

namespace Grej.Application.Catalog;

// Use cases for materials and colors in the CMS, written once for both: T is Material or Color.
// Built like AdminCategoryService. "new()" means T must be a class that can be created with
// new T(), which CreateAsync does. Only admin endpoints use it.
public class AdminPropertyService<T>(IPropertyRepository<T> properties) where T : ProductProperty, new()
{
    // One page, sorted by name.
    public async Task<PagedResult<PropertyDto>> GetPropertiesAsync(PropertyListQuery query, CancellationToken cancellationToken)
    {
        var page = await properties.GetPageAsync(query.Page, query.PageSize, cancellationToken);

        return new PagedResult<PropertyDto>(
            page.Items.Select(ToDto).ToList(),
            page.Page,
            page.PageSize,
            page.TotalCount);
    }

    // Null if no row has this id.
    public async Task<PropertyDetailsDto?> GetPropertyAsync(int id, CancellationToken cancellationToken)
    {
        var property = await properties.GetByIdAsync(id, cancellationToken);
        if (property is null)
        {
            return null;
        }

        var productCount = await properties.CountProductsAsync(id, cancellationToken);
        return new PropertyDetailsDto(property.Id, property.Name, productCount);
    }

    public async Task<PropertyDto> CreateAsync(PropertyRequest request, CancellationToken cancellationToken)
    {
        var property = new T { Name = request.Name.Trim() };

        properties.Add(property);
        await properties.SaveChangesAsync(cancellationToken);

        // The database has given it its id now.
        return ToDto(property);
    }

    // False if no row has this id.
    public async Task<bool> UpdateAsync(int id, PropertyRequest request, CancellationToken cancellationToken)
    {
        var property = await properties.GetByIdAsync(id, cancellationToken);
        if (property is null)
        {
            return false;
        }

        property.Name = request.Name.Trim();
        await properties.SaveChangesAsync(cancellationToken);
        return true;
    }

    // False if no row has this id. Unlike a category, it can be deleted even if products have
    // it, since a product is fine without it: the database removes it from those products
    // (cascade in ProductConfiguration). The CMS form warns the admin first.
    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var property = await properties.GetByIdAsync(id, cancellationToken);
        if (property is null)
        {
            return false;
        }

        properties.Remove(property);
        await properties.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static PropertyDto ToDto(T property) => new(property.Id, property.Name);
}
