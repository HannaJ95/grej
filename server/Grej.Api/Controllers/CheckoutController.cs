using Grej.Application.Orders;
using Microsoft.AspNetCore.Mvc;

namespace Grej.Api.Controllers;

// Checkout for the shop. Open to everyone, since customers buy as guests (constraints.md).
[ApiController]
[Route("api/checkout")]
public class CheckoutController(CheckoutService checkout) : ControllerBase
{
    // Creates an order and a payment, and returns the payment page to send the customer to.
    [HttpPost]
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
}
