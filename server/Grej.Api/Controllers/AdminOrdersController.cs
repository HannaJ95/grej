using Grej.Application.Identity;
using Grej.Application.Orders;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Grej.Api.Controllers;

// Orders in the CMS, protected like AdminCategoriesController. Only reading for now: setting
// Shipped or Cancelled comes in the next sprint item. An order is never deleted (constraints.md).
[ApiController]
[Route("api/admin/orders")]
[Authorize(Roles = Roles.Admin)]
public class AdminOrdersController(AdminOrderService orders) : ControllerBase
{
    // E.g. GET /api/admin/orders?all=true&page=2. Without all, only paid orders that are not shipped.
    [HttpGet]
    public async Task<IActionResult> GetPage([FromQuery] OrderListQuery query, CancellationToken cancellationToken)
    {
        var page = await orders.GetOrdersAsync(query, cancellationToken);

        return Ok(page);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var order = await orders.GetOrderAsync(id, cancellationToken);
        if (order is null)
        {
            return NotFound();
        }

        return Ok(order);
    }
}
