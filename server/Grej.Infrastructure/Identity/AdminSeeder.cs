using Grej.Application.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Grej.Infrastructure.Identity;

// Creates the shop's only admin account (constraints.md). Started with
// `dotnet run --project Grej.Api -- seed-admin`. The email and password come from
// User Secrets, never from the code. Safe to run again: it only adds what is missing.
public static class AdminSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        // UserManager and RoleManager use the DbContext, which lives in a scope.
        // A web request gets a scope automatically; a command has to create its own.
        using var scope = services.CreateScope();
        var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();
        var roles = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        var users = scope.ServiceProvider.GetRequiredService<UserManager<IdentityUser>>();

        var email = configuration["Admin:Email"]
            ?? throw new InvalidOperationException("Admin:Email is not configured.");
        var password = configuration["Admin:Password"]
            ?? throw new InvalidOperationException("Admin:Password is not configured.");

        if (!await roles.RoleExistsAsync(Roles.Admin))
        {
            ThrowIfFailed(await roles.CreateAsync(new IdentityRole(Roles.Admin)));
        }

        var admin = await users.FindByEmailAsync(email);
        if (admin is null)
        {
            admin = new IdentityUser { UserName = email, Email = email, EmailConfirmed = true };
            // Hashes the password and checks it against Identity's password rules.
            ThrowIfFailed(await users.CreateAsync(admin, password));
        }

        if (!await users.IsInRoleAsync(admin, Roles.Admin))
        {
            ThrowIfFailed(await users.AddToRoleAsync(admin, Roles.Admin));
        }
    }

    // Identity reports problems (e.g. a too weak password) as a result instead of an
    // exception. Stops the seed with Identity's own error messages.
    private static void ThrowIfFailed(IdentityResult result)
    {
        if (!result.Succeeded)
        {
            throw new InvalidOperationException(string.Join(" ", result.Errors.Select(error => error.Description)));
        }
    }
}
