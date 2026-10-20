using Grej.Application.Catalog;
using Microsoft.AspNetCore.Mvc;

namespace Grej.Api.Controllers;

// Products for the shop. Open to everyone, since visitors may browse
// products without logging in (constraints.md).
[ApiController]
[Route("api/products")]
public class ProductsController(ProductService products) : ControllerBase
{
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
