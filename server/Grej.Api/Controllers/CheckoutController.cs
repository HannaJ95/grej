using Grej.Application.Orders;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Grej.Api.Controllers;

// Checkout for the shop. Open to everyone, since customers buy as guests (constraints.md).
[ApiController]
[Route("api/checkout")]
public class CheckoutController(CheckoutService checkout) : ControllerBase
{
    [HttpPost]
    [EnableRateLimiting(RateLimits.Checkout)]
    public async Task<IActionResult> Create(CheckoutRequest request, CancellationToken cancellationToken)
    {
        var result = await checkout.CreateCheckoutAsync(request, cancellationToken);
        if (result.UnavailableItems.Count > 0)
        {
            // Valid, but some rows cannot be bought now. The list says how many are left of each.
            return Conflict(new { result.UnavailableItems });
        }

        return Ok(new { url = result.Url });
    }

    // For the success page. The session id is long and random, so only the customer has it (ambiguity.md).
    [HttpGet("{sessionId}")]
    public async Task<IActionResult> GetOrder(string sessionId, CancellationToken cancellationToken)
    {
        var order = await checkout.GetOrderAsync(sessionId, cancellationToken);
        return order is null ? NotFound() : Ok(order);
    }
}
