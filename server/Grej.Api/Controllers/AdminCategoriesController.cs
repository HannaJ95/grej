using Grej.Application.Catalog;
using Grej.Application.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Grej.Api.Controllers;

// Categories in the CMS, protected like AdminProductsController: 401 without a valid
// token, 403 without the Admin role (constraints.md).
[ApiController]
[Route("api/admin/categories")]
[Authorize(Roles = Roles.Admin)]
public class AdminCategoriesController(AdminCategoryService categories) : ControllerBase
{
    // E.g. GET /api/admin/categories?page=2. Sorted by name.
    [HttpGet]
    public async Task<IActionResult> GetPage([FromQuery] CategoryListQuery query, CancellationToken cancellationToken)
    {
        var page = await categories.GetCategoriesAsync(query, cancellationToken);

        return Ok(page);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var category = await categories.GetCategoryAsync(id, cancellationToken);
        if (category is null)
        {
            return NotFound();
        }

        return Ok(category);
    }

    // [ApiController] answers 400 by itself if the name breaks a rule in CategoryRequest.
    [HttpPost]
    public async Task<IActionResult> Create(CategoryRequest request, CancellationToken cancellationToken)
    {
        var category = await categories.CreateAsync(request, cancellationToken);

        return CreatedAtAction(nameof(GetById), new { id = category.Id }, category);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, CategoryRequest request, CancellationToken cancellationToken)
    {
        var found = await categories.UpdateAsync(id, request, cancellationToken);

        return found ? NoContent() : NotFound();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var result = await categories.DeleteAsync(id, cancellationToken);

        // 409: the category has products, which must be moved to another category first.
        return result switch
        {
            DeleteCategoryResult.NotFound => NotFound(),
            DeleteCategoryResult.HasProducts => Conflict(),
            _ => NoContent(),
        };
    }
}
