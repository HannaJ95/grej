using Microsoft.AspNetCore.Mvc;

namespace Grej.Api.Controllers;

// Lets the frontend, the hosting and the tests check that the API is up.
[ApiController]
[Route("api/health")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get() => Ok(new { status = "ok" });
}
