using Grej.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Grej.Infrastructure;

public static class DependencyInjection
{
    // Called once from Program.cs. Infrastructure decides how its own
    // services are set up, so the Api project only needs this one line.
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // "ConnectionStrings:Grej" comes from User Secrets locally and from an
        // environment variable (ConnectionStrings__Grej) in hosting.
        services.AddDbContext<GrejDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("Grej")));

        return services;
    }
}
