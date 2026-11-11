using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Grej.Application.Catalog;
using Grej.Application.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.JsonWebTokens;

namespace Grej.Api.Controllers;

// Products in the CMS: 401 without a valid token, 403 without the Admin role (constraints.md).
[ApiController]
[Route("api/admin/products")]
[Authorize(Roles = Roles.Admin)]
public class AdminProductsController(AdminProductService products) : ControllerBase
{
    // E.g. GET /api/admin/products?categoryId=3&isActive=false&search=vas&sort=priceAscending.
    [HttpGet]
    public async Task<IActionResult> GetPage([FromQuery] AdminProductListQuery query, CancellationToken cancellationToken)
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

    [HttpPost]
    public async Task<IActionResult> Create(ProductRequest request, CancellationToken cancellationToken)
    {
        // [Authorize] has checked the token, so its "sub" claim is always there.
        var sellerId = User.FindFirstValue(JwtRegisteredClaimNames.Sub)!;

        var product = await products.CreateAsync(request, sellerId, cancellationToken);
        if (product is null)
        {
            return ChoiceNotFound();
        }

        return CreatedAtAction(nameof(GetById), new { id = product.Id }, product);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, UpdateProductRequest request, CancellationToken cancellationToken)
    {
        var result = await products.UpdateAsync(id, request, cancellationToken);

        // 409: the stock has changed since the form was opened.
        return result switch
        {
            UpdateProductResult.NotFound => NotFound(),
            UpdateProductResult.ChoiceNotFound => ChoiceNotFound(),
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

    // Multipart, since JSON cannot carry a file.
    [HttpPost("{id}/images")]
    // Larger requests are refused (413) before they are read. A bit more than ImageFile.MaxBytes,
    // since the request also holds the alt text and the form's separators.
    [RequestSizeLimit(ImageFile.MaxBytes + 100_000)]
    public async Task<IActionResult> AddImage(
        int id,
        IFormFile file,
        [FromForm, MaxLength(200)] string altText,
        CancellationToken cancellationToken)
    {
        using var memory = new MemoryStream();
        await file.CopyToAsync(memory, cancellationToken);
        var image = ImageFile.FromBytes(memory.ToArray());
        if (image is null)
        {
            // The same kind of 400 answer as when a rule in ProductRequest is broken.
            ModelState.AddModelError(nameof(file), "The file must be a jpg, png or webp image of at most 5 MB.");
            return ValidationProblem(ModelState);
        }

        return ImageChanged(await products.AddImageAsync(id, image, altText, cancellationToken));
    }

    [HttpDelete("{id}/images/{imageId}")]
    public async Task<IActionResult> RemoveImage(int id, int imageId, CancellationToken cancellationToken) =>
        ImageChanged(await products.RemoveImageAsync(id, imageId, cancellationToken));

    // E.g. PUT /api/admin/products/7/images/order with {"imageIds": [12, 10, 11]}.
    [HttpPut("{id}/images/order")]
    public async Task<IActionResult> OrderImages(int id, ImageOrderRequest request, CancellationToken cancellationToken) =>
        ImageChanged(await products.OrderImagesAsync(id, request.ImageIds, cancellationToken));

    // Every image endpoint answers with the product's images in order, so the CMS shows what was saved.
    private IActionResult ImageChanged(ImageChangeResult result)
    {
        // 409: the file was fine, but the product has no room for another image.
        return result.Status switch
        {
            ImageChangeStatus.NotFound => NotFound(),
            ImageChangeStatus.Full => Conflict(),
            ImageChangeStatus.WrongImages => WrongImages(),
            _ => Ok(result.Images),
        };
    }

    // The same kind of 400 answer as ChoiceNotFound below.
    private IActionResult WrongImages()
    {
        ModelState.AddModelError(nameof(ImageOrderRequest.ImageIds), "The ids must be the product's images, each once.");
        return ValidationProblem(ModelState);
    }

    // The same 400 as a broken rule in ProductRequest, so the frontend handles both alike. The
    // key "" means the whole request, not one field.
    private IActionResult ChoiceNotFound()
    {
        ModelState.AddModelError(string.Empty, "The category, a material or a color does not exist.");
        return ValidationProblem(ModelState);
    }
}
