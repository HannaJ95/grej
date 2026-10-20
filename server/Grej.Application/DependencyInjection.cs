using Grej.Application.Catalog;
using Microsoft.Extensions.DependencyInjection;

namespace Grej.Application;

public static class DependencyInjection
{
    // Called once from Program.cs, like AddInfrastructure.
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<ProductService>();

        return services;
    }
}
