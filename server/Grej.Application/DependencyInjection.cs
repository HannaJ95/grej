using Grej.Application.Catalog;
using Grej.Application.Orders;
using Grej.Application.Payments;
using Microsoft.Extensions.DependencyInjection;

namespace Grej.Application;

public static class DependencyInjection
{
    // Called once from Program.cs, like AddInfrastructure.
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<ProductService>();
        services.AddScoped<AdminProductService>();
        services.AddScoped<AdminCategoryService>();
        // One line for both AdminPropertyService<Material> and AdminPropertyService<Color>.
        // typeof(...<>) without a type is an "open generic": DI fills in T when a controller asks.
        services.AddScoped(typeof(AdminPropertyService<>));
        services.AddScoped<CheckoutService>();
        services.AddScoped<OrderService>();
        services.AddScoped<PaymentWebhookService>();

        return services;
    }
}
