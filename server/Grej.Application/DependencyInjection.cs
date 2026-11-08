using Grej.Application.Catalog;
using Grej.Application.Orders;
using Grej.Application.Payments;
using Microsoft.Extensions.DependencyInjection;

namespace Grej.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<ProductService>();
        services.AddScoped<AdminProductService>();
        services.AddScoped<AdminCategoryService>();
        services.AddScoped<CategoryService>();
        // Open generics: one line covers both Material and Color.
        services.AddScoped(typeof(AdminPropertyService<>));
        services.AddScoped(typeof(PropertyService<>));
        services.AddScoped<CheckoutService>();
        services.AddScoped<OrderService>();
        services.AddScoped<AdminOrderService>();
        services.AddScoped<PaymentWebhookService>();

        return services;
    }
}
