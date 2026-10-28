using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Grej.Application.Catalog;
using Grej.Application.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.JsonWebTokens;

namespace Grej.Api.Controllers;

// Products in the CMS. [Authorize] on the class protects every endpoint here:
// 401 without a valid token, 403 without the Admin role (constraints.md).
[ApiController]
[Route("api/admin/products")]
[Authorize(Roles = Roles.Admin)]
public class AdminProductsController(AdminProductService products) : ControllerBase
{
    // E.g. GET /api/admin/products?page=2. Hidden products are included.
    [HttpGet]
    public async Task<IActionResult> GetPage([FromQuery] ProductListQuery query, CancellationToken cancellationToken)
    {
        var page = await products.GetProductsAsync(query, cancellationToken);

        return Ok(page);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var product = await products.GetProductAsync(id, cancellationToken);
        if (product is null)
        {
            return NotFound();
        }

        return Ok(product);
    }

    // [ApiController] answers 400 by itself if the request breaks a rule in
    // ProductRequest, so the methods below only run with valid data.
    [HttpPost]
    public async Task<IActionResult> Create(ProductRequest request, CancellationToken cancellationToken)
    {
        // The logged-in admin's user id, from the token's "sub" claim (IdentityLoginService).
        // [Authorize] has already checked the token, so the claim is always there.
        var sellerId = User.FindFirstValue(JwtRegisteredClaimNames.Sub)!;

        var product = await products.CreateAsync(request, sellerId, cancellationToken);
        if (product is null)
        {
            return CategoryNotFound();
        }

        // 201 Created, with the new product's URL in the Location header.
        return CreatedAtAction(nameof(GetById), new { id = product.Id }, product);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, UpdateProductRequest request, CancellationToken cancellationToken)
    {
        var result = await products.UpdateAsync(id, request, cancellationToken);

        // Each result becomes an HTTP status. 409: the request was fine, but the
        // stock has changed since the form was opened.
        return result switch
        {
            UpdateProductResult.NotFound => NotFound(),
            UpdateProductResult.CategoryNotFound => CategoryNotFound(),
            UpdateProductResult.StockChanged => Conflict(),
            _ => NoContent(),
        };
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var result = await products.DeleteAsync(id, cancellationToken);

        // 409: the product is on an order, so the admin must hide it instead.
        return result switch
        {
            DeleteProductResult.NotFound => NotFound(),
            DeleteProductResult.OnOrder => Conflict(),
            _ => NoContent(),
        };
    }

    // E.g. PUT /api/admin/products/7/image. Sent as a form with a file (multipart/form-data),
    // since JSON cannot carry a file. Replaces the product's image (one per product).
    [HttpPut("{id}/image")]
    // Larger requests are refused (413) before they are read. A bit more than ImageFile.MaxBytes,
    // since the request also holds the alt text and the form's separators.
    [RequestSizeLimit(ImageFile.MaxBytes + 100_000)]
    public async Task<IActionResult> SetImage(
        int id,
        IFormFile file,
        [FromForm, MaxLength(200)] string altText,
        CancellationToken cancellationToken)
    {
        // [ApiController] has already answered 400 if the file or the alt text is missing,
        // since neither is nullable.
        using var memory = new MemoryStream();
        await file.CopyToAsync(memory, cancellationToken);
        var image = ImageFile.FromBytes(memory.ToArray());
        if (image is null)
        {
            // The same kind of 400 answer as when a rule in ProductRequest is broken.
            ModelState.AddModelError(nameof(file), "The file must be a jpg, png or webp image of at most 5 MB.");
            return ValidationProblem(ModelState);
        }

        var saved = await products.SetImageAsync(id, image, altText, cancellationToken);
        if (saved is null)
        {
            return NotFound();
        }

        return Ok(saved);
    }

    [HttpDelete("{id}/image")]
    public async Task<IActionResult> RemoveImage(int id, CancellationToken cancellationToken)
    {
        var found = await products.RemoveImageAsync(id, cancellationToken);

        return found ? NoContent() : NotFound();
    }

    // The same kind of 400 answer as when a rule in ProductRequest is broken, so the
    // frontend handles both the same way.
    private IActionResult CategoryNotFound()
    {
        ModelState.AddModelError(nameof(ProductRequest.CategoryId), "The category does not exist.");
        return ValidationProblem(ModelState);
    }
}
