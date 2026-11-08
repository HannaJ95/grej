using Grej.Domain.Catalog;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Grej.IntegrationTests;

public class ColorsEndpointTests(WebApplicationFactory<Program> factory)
    : PropertiesEndpointTests<Color>(factory)
{
    protected override string Url => "/api/colors";

    protected override void AddTo(Product product, Color color) => product.SetColors([color]);
}
