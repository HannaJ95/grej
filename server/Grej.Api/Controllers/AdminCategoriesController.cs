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
    // E.g. GET /api/admin/categories?page=2. Each main category is followed by its subcategories.
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
        if (category is null)
        {
            return InvalidParent();
        }

        return CreatedAtAction(nameof(GetById), new { id = category.Id }, category);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, CategoryRequest request, CancellationToken cancellationToken)
    {
        var result = await categories.UpdateAsync(id, request, cancellationToken);

        return result switch
        {
            UpdateCategoryResult.NotFound => NotFound(),
            UpdateCategoryResult.InvalidParent => InvalidParent(),
            _ => NoContent(),
        };
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var result = await categories.DeleteAsync(id, cancellationToken);

        // 409: the category has products or subcategories, which must be moved or deleted
        // first. The reason in the body lets the CMS show the right message.
        return result switch
        {
            DeleteCategoryResult.NotFound => NotFound(),
            DeleteCategoryResult.HasProducts => Conflict(new { reason = "hasProducts" }),
            DeleteCategoryResult.HasSubcategories => Conflict(new { reason = "hasSubcategories" }),
            _ => NoContent(),
        };
    }

    // The same kind of 400 answer as when a rule in CategoryRequest is broken, like
    // ChoiceNotFound in AdminProductsController, but on the parentId field.
    private IActionResult InvalidParent()
    {
        ModelState.AddModelError(nameof(CategoryRequest.ParentId), "The main category does not exist or is a subcategory.");
        return ValidationProblem(ModelState);
    }
}
