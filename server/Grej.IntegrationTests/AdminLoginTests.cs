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

namespace Grej.IntegrationTests;

// Tests the admin seed and POST /api/auth/login through the real API and the real
// ASP.NET Core Identity, with EF Core's in-memory database instead of PostgreSQL.
public class AdminLoginTests : IClassFixture<WebApplicationFactory<Program>>
{
    private const string Email = "admin@example.com";
    private const string Password = "Test-password-1";

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
}
