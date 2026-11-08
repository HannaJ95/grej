using Grej.Application.Catalog;
using Grej.Domain.Catalog;
using Microsoft.AspNetCore.Mvc;

namespace Grej.Api.Controllers;

// The shop's materials and colors for the filter, open to everyone like CategoriesController.
// Abstract like AdminPropertiesController: MaterialsController and ColorsController give the route.
[ApiController]
public abstract class PropertiesController<T>(PropertyService<T> properties) : ControllerBase
    where T : ProductProperty
{
    // E.g. GET /api/materials gives [{ "id": 1, "name": "Lergods", "productCount": 4 }].
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var all = await properties.GetPropertiesAsync(cancellationToken);

        return Ok(all);
    }
}
