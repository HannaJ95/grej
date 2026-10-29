using Grej.Domain.Catalog;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Grej.IntegrationTests;

// Runs every test in AdminPropertiesEndpointTests for materials.
public class AdminMaterialsEndpointTests(WebApplicationFactory<Program> factory)
    : AdminPropertiesEndpointTests<Material>(factory)
{
    protected override string Url => "/api/admin/materials";

    protected override void AddTo(Product product, Material material) => product.SetMaterials([material]);
}
