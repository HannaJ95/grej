using Grej.Domain.Catalog;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Grej.IntegrationTests;

// Runs every test in AdminPropertiesEndpointTests for colors.
public class AdminColorsEndpointTests(WebApplicationFactory<Program> factory)
    : AdminPropertiesEndpointTests<Color>(factory)
{
    protected override string Url => "/api/admin/colors";

    protected override void AddTo(Product product, Color color) => product.SetColors([color]);
}
