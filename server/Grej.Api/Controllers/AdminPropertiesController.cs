using Grej.Application.Catalog;
using Grej.Application.Identity;
using Grej.Domain.Catalog;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Grej.Api.Controllers;

// The CMS's endpoints for materials and colors, written once for both. Abstract, so ASP.NET Core
// never uses it as a controller by itself: AdminMaterialsController and AdminColorsController
// inherit every endpoint below and give the route and the type. The attributes here are inherited
// too, so both are protected like AdminCategoriesController: 401 without a valid token, 403
// without the Admin role (constraints.md).
[ApiController]
[Authorize(Roles = Roles.Admin)]
public abstract class AdminPropertiesController<T>(AdminPropertyService<T> properties) : ControllerBase
    where T : ProductProperty, new()
{
    // E.g. GET /api/admin/materials?page=2. Sorted by name.
    [HttpGet]
    public async Task<IActionResult> GetPage([FromQuery] PropertyListQuery query, CancellationToken cancellationToken)
    {
        var page = await properties.GetPropertiesAsync(query, cancellationToken);

        return Ok(page);
    }

    // With the number of products that have it.
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var property = await properties.GetPropertyAsync(id, cancellationToken);
        if (property is null)
        {
            return NotFound();
        }

        return Ok(property);
    }

    // [ApiController] answers 400 by itself if the name breaks a rule in PropertyRequest.
    [HttpPost]
    public async Task<IActionResult> Create(PropertyRequest request, CancellationToken cancellationToken)
    {
        var property = await properties.CreateAsync(request, cancellationToken);

        return CreatedAtAction(nameof(GetById), new { id = property.Id }, property);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, PropertyRequest request, CancellationToken cancellationToken)
    {
        var found = await properties.UpdateAsync(id, request, cancellationToken);

        return found ? NoContent() : NotFound();
    }

    // Also when products have it; it is removed from them too (AdminPropertyService.DeleteAsync).
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var found = await properties.DeleteAsync(id, cancellationToken);

        return found ? NoContent() : NotFound();
    }
}
