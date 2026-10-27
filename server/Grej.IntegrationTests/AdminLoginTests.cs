using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using Grej.Application.Identity;
using Grej.Infrastructure.Identity;
using Grej.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace Grej.IntegrationTests;

// Tests the admin seed, POST /api/auth/login and the role check on admin endpoints
// through the real API and the real ASP.NET Core Identity, with EF Core's in-memory
// database instead of PostgreSQL.
public class AdminLoginTests : IClassFixture<WebApplicationFactory<Program>>
{
    private const string Email = "admin@example.com";
    private const string Password = "Test-password-1";
    // HMAC-SHA256 needs a key of at least 32 bytes.
    private const string SigningKey = "test-signing-key-that-is-at-least-32-bytes";

    private readonly WebApplicationFactory<Program> app;

    public AdminLoginTests(WebApplicationFactory<Program> factory)
    {
        // xUnit creates a new instance of the class for each test, so each test
        // gets its own empty in-memory database.
        var databaseName = Guid.NewGuid().ToString();

        app = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["Admin:Email"] = Email,
                    ["Admin:Password"] = Password,
                    ["Jwt:SigningKey"] = SigningKey,
                }));
            builder.ConfigureTestServices(services =>
            {
                // Removes the PostgreSQL setup from AddInfrastructure, so the in-memory
                // database below is the only one.
                services.RemoveAll<IDbContextOptionsConfiguration<GrejDbContext>>();
                services.AddDbContext<GrejDbContext>(options => options.UseInMemoryDatabase(databaseName));
            });
        });
    }

    [Fact]
    public async Task Seed_RunTwice_CreatesOneAdmin()
    {
        await AdminSeeder.SeedAsync(app.Services);
        await AdminSeeder.SeedAsync(app.Services);

        using var scope = app.Services.CreateScope();
        var users = scope.ServiceProvider.GetRequiredService<UserManager<IdentityUser>>();
        var admin = Assert.Single(users.Users.ToList());
        Assert.Equal(Email, admin.Email);
        Assert.True(await users.IsInRoleAsync(admin, Roles.Admin));
        // Only the hash is stored, never the password itself (constraints.md).
        Assert.NotEqual(Password, admin.PasswordHash);
    }

    [Fact]
    public async Task Login_RightPassword_ReturnsSignedTokenWithAdminRole()
    {
        await AdminSeeder.SeedAsync(app.Services);

        var response = await app.CreateClient().PostAsJsonAsync("/api/auth/login", new LoginRequest(Email, Password));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<LoginResult>();
        Assert.NotNull(body);

        // Checks the token the same way the API will check it on admin requests:
        // signed with our key, made by us, for us, and not expired.
        var validation = await new JsonWebTokenHandler().ValidateTokenAsync(body.Token, new TokenValidationParameters
        {
            ValidIssuer = "grej-api",
            ValidAudience = "grej-api",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(SigningKey)),
        });
        Assert.True(validation.IsValid);
        Assert.Equal(Roles.Admin, validation.Claims["role"]);
        Assert.Equal(Email, validation.Claims["email"]);
    }

    [Fact]
    public async Task Login_WrongPassword_ReturnsUnauthorized()
    {
        await AdminSeeder.SeedAsync(app.Services);

        var response = await app.CreateClient().PostAsJsonAsync("/api/auth/login", new LoginRequest(Email, "Wrong-password-1"));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_UnknownEmail_ReturnsUnauthorized()
    {
        await AdminSeeder.SeedAsync(app.Services);

        var response = await app.CreateClient().PostAsJsonAsync("/api/auth/login", new LoginRequest("someone@example.com", Password));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_AfterFiveWrongPasswords_IsLockedEvenWithRightPassword()
    {
        await AdminSeeder.SeedAsync(app.Services);
        var client = app.CreateClient();

        for (var attempt = 0; attempt < 5; attempt++)
        {
            await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(Email, "Wrong-password-1"));
        }
        var response = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(Email, Password));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Me_WithoutToken_ReturnsUnauthorized()
    {
        var response = await app.CreateClient().GetAsync("/api/auth/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Me_WithTokenFromLogin_ReturnsAdminEmail()
    {
        await AdminSeeder.SeedAsync(app.Services);
        var login = await app.CreateClient().PostAsJsonAsync("/api/auth/login", new LoginRequest(Email, Password));
        var token = (await login.Content.ReadFromJsonAsync<LoginResult>())!.Token;

        var response = await GetMe(token);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<MeResponse>();
        Assert.Equal(Email, body?.Email);
    }

    [Fact]
    public async Task Me_AdminTokenSignedWithAnotherKey_ReturnsUnauthorized()
    {
        // Someone who does not know our key cannot make their own admin token.
        var token = CreateToken("another-signing-key-that-is-at-least-32-bytes", new Claim("role", Roles.Admin));

        var response = await GetMe(token);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Me_TokenWithoutAdminRole_ReturnsForbidden()
    {
        // Signed with our key, so the API knows who is asking, but that user is not an admin.
        var token = CreateToken(SigningKey, new Claim("email", "someone@example.com"));

        var response = await GetMe(token);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    // Sends the token the same way the frontend does: "Authorization: Bearer <token>".
    private Task<HttpResponseMessage> GetMe(string token)
    {
        var client = app.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client.GetAsync("/api/auth/me");
    }

    // A token made like IdentityLoginService makes it, but with any key and claims.
    private static string CreateToken(string signingKey, params Claim[] claims) =>
        new JsonWebTokenHandler().CreateToken(new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Issuer = "grej-api",
            Audience = "grej-api",
            Expires = DateTime.UtcNow.AddHours(1),
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(signingKey)),
                SecurityAlgorithms.HmacSha256),
        });

    private record MeResponse(string Email);
}
