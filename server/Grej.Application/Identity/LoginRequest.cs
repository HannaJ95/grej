using System.ComponentModel.DataAnnotations;

namespace Grej.Application.Identity;

// What the login form sends to POST /api/auth/login.
public record LoginRequest(
    [Required] string Email,
    [Required] string Password);
