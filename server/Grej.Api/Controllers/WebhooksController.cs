using Grej.Application.Payments;
using Microsoft.AspNetCore.Mvc;

namespace Grej.Api.Controllers;

// Webhooks: Stripe calls the API when something happens with a payment. There is no login,
// so every request is checked by its signature instead (constraints.md).
[ApiController]
[Route("api/webhooks")]
public class WebhooksController(PaymentWebhookService webhooks) : ControllerBase
{
    [HttpPost("stripe")]
    public async Task<IActionResult> HandleStripe(CancellationToken cancellationToken)
    {
        // The signature is computed from the exact text Stripe sent, so the body is read
        // as raw text instead of being turned into a C# object first.
        using var reader = new StreamReader(Request.Body);
        var payload = await reader.ReadToEndAsync(cancellationToken);
        var signature = Request.Headers["Stripe-Signature"].ToString();

        var handled = await webhooks.HandleAsync(payload, signature, cancellationToken);

        // 200 tells Stripe the event has arrived. Any other answer makes Stripe send it again later.
        return handled ? Ok() : BadRequest();
    }
}
