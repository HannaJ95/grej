using Grej.Application.Catalog;
using Grej.Infrastructure.Persistence.Repositories;
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
        services.AddDbContext<GrejDbContext>(options => options
            .UseNpgsql(configuration.GetConnectionString("Grej"))
            // Runs after `dotnet ef database update`. Only the synchronous version
            // is needed, since the API never migrates the database itself.
            .UseSeeding((context, _) => DemoData.Seed(context)));

        services.AddScoped<IProductRepository, ProductRepository>();

        return services;
    }
}
