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
        services.AddScoped<CheckoutService>();
        services.AddScoped<OrderService>();
        services.AddScoped<PaymentWebhookService>();

        return services;
    }
}
