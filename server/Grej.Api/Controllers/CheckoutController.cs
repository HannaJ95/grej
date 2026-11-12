using Grej.Application.Orders;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Grej.Api.Controllers;

// Checkout for the shop. Open to everyone, since customers buy as guests (constraints.md).
[ApiController]
[Route("api/checkout")]
public class CheckoutController(CheckoutService checkout) : ControllerBase
{
    // Creates an order and a payment, and returns the payment page to send the customer to.
    [HttpPost]
    [EnableRateLimiting(RateLimits.Checkout)]
    public async Task<IActionResult> Create(CheckoutRequest request, CancellationToken cancellationToken)
    {
        var result = await checkout.CreateCheckoutAsync(request, cancellationToken);
        if (result.UnavailableItems.Count > 0)
        {
            // The request is valid, but some rows cannot be bought right now. The list
            // tells the frontend how many are left of each, so it can fix the cart.
            return Conflict(new { result.UnavailableItems });
        }

        return Ok(new { url = result.Url });
    }

    // The order for the success page. Stripe's session id is long and random, so only the
    // customer Stripe sent there can know it (ambiguity.md).
    [HttpGet("{sessionId}")]
    public async Task<IActionResult> GetOrder(string sessionId, CancellationToken cancellationToken)
    {
        var order = await checkout.GetOrderAsync(sessionId, cancellationToken);
        return order is null ? NotFound() : Ok(order);
    }
}
