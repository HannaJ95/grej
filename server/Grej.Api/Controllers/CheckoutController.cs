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
        var url = await checkout.CreateCheckoutAsync(request, cancellationToken);
        if (url is null)
        {
            // The request is valid, but a product cannot be bought right now.
            return Conflict();
        }

        return Ok(new { url });
    }
}
