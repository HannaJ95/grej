using Grej.Application.Identity;
using Grej.Application.Orders;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Grej.Api.Controllers;

// Orders in the CMS, protected like AdminCategoriesController. The admin only changes the order
// status, never the payment, the rows or the prices, and an order is never deleted (ambiguity.md).
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

    // E.g. POST /api/admin/orders/7/ship, without a body. POST, since it is an action on the
    // order, not a new version of it sent by the browser (which would be PUT).
    [HttpPost("{id}/ship")]
    public async Task<IActionResult> Ship(int id, CancellationToken cancellationToken)
    {
        var result = await orders.ShipAsync(id, cancellationToken);

        return ToResponse(result);
    }

    // Puts the products back in stock. The admin refunds the customer in Stripe (ambiguity.md).
    [HttpPost("{id}/cancel")]
    public async Task<IActionResult> Cancel(int id, CancellationToken cancellationToken)
    {
        var result = await orders.CancelAsync(id, cancellationToken);

        return ToResponse(result);
    }

    // 409: the request was fine, but the order's status or payment does not allow it,
    // e.g. shipping an unpaid order or cancelling an order twice.
    private IActionResult ToResponse(ChangeOrderStatusResult result) => result switch
    {
        ChangeOrderStatusResult.NotFound => NotFound(),
        ChangeOrderStatusResult.NotAllowed => Conflict(),
        _ => NoContent(),
    };
}
