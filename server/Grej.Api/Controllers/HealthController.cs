using Grej.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;

namespace Grej.Api.Controllers;

// Lets the frontend, the hosting and the tests check that the API is up.
[ApiController]
[Route("api/health")]
public class HealthController : ControllerBase
{
    // Only checks that the API itself is running, never the database,
    // so the hosting does not restart the API when the database has a hiccup.
    [HttpGet]
    public IActionResult Get() => Ok(new { status = "ok" });

    // Checks that the API can reach the database. [FromServices] means the
    // DbContext is only created for this endpoint, not for Get() above.
    [HttpGet("database")]
    public async Task<IActionResult> Database([FromServices] GrejDbContext db, CancellationToken cancellationToken)
    {
        try
        {
            if (await db.Database.CanConnectAsync(cancellationToken))
            {
                return Ok(new { status = "ok" });
            }
        }
        catch (InvalidOperationException)
        {
            // Thrown when no connection string is configured.
        }

        return StatusCode(StatusCodes.Status503ServiceUnavailable, new { status = "unavailable" });
    }
}
