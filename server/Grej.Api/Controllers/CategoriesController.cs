using Grej.Application.Catalog;
using Microsoft.AspNetCore.Mvc;

namespace Grej.Api.Controllers;

// Categories for the shop's filter. Open to everyone, like ProductsController.
[ApiController]
[Route("api/categories")]
public class CategoriesController(CategoryService categories) : ControllerBase
{
    // GET /api/categories, e.g. [{ "id": 1, "name": "Keramik", "productCount": 42 }].
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var all = await categories.GetCategoriesAsync(cancellationToken);

        return Ok(all);
    }
}
