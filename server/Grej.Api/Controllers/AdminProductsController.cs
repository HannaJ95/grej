using Grej.Application.Catalog;
using Grej.Application.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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
        var product = await products.CreateAsync(request, cancellationToken);

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
}
