using Grej.Application.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Grej.Api.Controllers;

// Admin login. Open to everyone, since nobody is logged in before they log in.
[ApiController]
[Route("api/auth")]
public class AuthController(ILoginService login) : ControllerBase
{
    // Returns a token if the email and password are right.
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var result = await login.LoginAsync(request);

        // The same answer for an unknown email, a wrong password and a locked account,
        // so the API never tells anyone which email addresses have an account.
        return result is null ? Unauthorized() : Ok(result);
    }
}
