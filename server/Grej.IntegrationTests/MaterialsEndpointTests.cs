using Grej.Domain.Catalog;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Grej.IntegrationTests;

public class MaterialsEndpointTests(WebApplicationFactory<Program> factory)
    : PropertiesEndpointTests<Material>(factory)
{
    protected override string Url => "/api/materials";

    protected override void AddTo(Product product, Material material) => product.SetMaterials([material]);
}
