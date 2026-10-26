using System.Security.Claims;
using System.Text;
using Grej.Application.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace Grej.Infrastructure.Identity;

// Logs in against ASP.NET Core Identity's user tables and answers with a JWT,
// which the frontend sends with every admin request (architecture.md).
public class IdentityLoginService(UserManager<IdentityUser> users, IConfiguration configuration) : ILoginService
{
    // There are no refresh tokens, so the admin logs in again after this.
    private static readonly TimeSpan TokenLifetime = TimeSpan.FromHours(8);

    public async Task<LoginResult?> LoginAsync(LoginRequest request)
    {
        var user = await users.FindByEmailAsync(request.Email);
        if (user is null || await users.IsLockedOutAsync(user))
        {
            return null;
        }

        if (!await users.CheckPasswordAsync(user, request.Password))
        {
            // Counts the failed attempt. After 5 in a row the account is locked for
            // 5 minutes (Identity's defaults), so nobody can guess the password.
            await users.AccessFailedAsync(user);
            return null;
        }

        await users.ResetAccessFailedCountAsync(user);
        return CreateToken(user, await users.GetRolesAsync(user));
    }

    private LoginResult CreateToken(IdentityUser user, IEnumerable<string> roles)
    {
        var expiresAt = DateTime.UtcNow.Add(TokenLifetime);

        // What the token says about the user: "sub" is the user's id, and there is
        // one "role" claim per role, e.g. Admin.
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id),
            new(JwtRegisteredClaimNames.Email, user.Email!),
        };
        claims.AddRange(roles.Select(role => new Claim("role", role)));

        var token = new JsonWebTokenHandler().CreateToken(new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Issuer = Setting("Jwt:Issuer"),
            Audience = Setting("Jwt:Audience"),
            Expires = expiresAt,
            // Signed with the secret key, so the API can tell that it made the token
            // itself and that nobody has changed it, e.g. added a role.
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(Setting("Jwt:SigningKey"))),
                SecurityAlgorithms.HmacSha256),
        });

        return new LoginResult(token, expiresAt);
    }

    // "Jwt:SigningKey" comes from User Secrets locally and Jwt__SigningKey in hosting.
    // Issuer and Audience are not secret and live in appsettings.json.
    private string Setting(string key) =>
        configuration[key] ?? throw new InvalidOperationException($"{key} is not configured.");
}
