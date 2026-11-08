using Grej.Domain.Catalog;

namespace Grej.Application.Catalog;

// Materials and colors for the shop, open to everyone like CategoryService. The CMS uses
// AdminPropertyService.
public class PropertyService<T>(IPropertyRepository<T> properties) where T : ProductProperty
{
    // Only those with active products, so the customer never picks one that shows nothing.
    public async Task<IReadOnlyList<ShopPropertyDto>> GetPropertiesAsync(CancellationToken cancellationToken)
    {
        var all = await properties.GetAllAsync(cancellationToken);
        var counts = await properties.CountActiveProductsAsync(cancellationToken);

        return all
            .Where(p => counts.ContainsKey(p.Id))
            .Select(p => new ShopPropertyDto(p.Id, p.Name, counts[p.Id]))
            .ToList();
    }
}
