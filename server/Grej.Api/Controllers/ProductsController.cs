using Grej.Application.Catalog;
using Microsoft.AspNetCore.Mvc;

namespace Grej.Api.Controllers;

// Products for the shop. Open to everyone, since visitors may browse
// products without logging in (constraints.md).
[ApiController]
[Route("api/products")]
public class ProductsController(ProductService products) : ControllerBase
{
    // E.g. GET /api/products?page=2. [ApiController] returns 400 by itself
    // if page or pageSize is outside the ranges in ProductListQuery.
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
}

