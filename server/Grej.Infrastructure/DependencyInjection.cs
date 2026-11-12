using Grej.Application.Catalog;
using Grej.Application.Common;
using Grej.Application.Identity;
using Grej.Application.Orders;
using Grej.Application.Payments;
using Grej.Infrastructure.Email;
using Grej.Infrastructure.Identity;
using Grej.Infrastructure.Images;
using Grej.Infrastructure.Persistence;
using Grej.Infrastructure.Persistence.Repositories;
using Grej.Infrastructure.Stripe;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Stripe;

namespace Grej.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<GrejDbContext>(options => options.UseNpgsql(
            configuration.GetConnectionString("Grej"),
            // One query with joins, faster than one trip to Supabase per list. Explicit, or EF Core warns.
            npgsql => npgsql.UseQuerySplittingBehavior(QuerySplittingBehavior.SingleQuery)));

        // Core only, without the cookie login, since the API uses JWT.
        services.AddIdentityCore<IdentityUser>()
            .AddRoles<IdentityRole>()
            .AddEntityFrameworkStores<GrejDbContext>();
        services.AddScoped<ILoginService, IdentityLoginService>();

        services.AddScoped<IProductRepository, ProductRepository>();
        services.AddScoped<ICategoryRepository, CategoryRepository>();
        services.AddScoped(typeof(IPropertyRepository<>), typeof(PropertyRepository<>));
        services.AddScoped<IOrderRepository, OrderRepository>();
        services.AddScoped<IPaymentRepository, PaymentRepository>();

        // One client, as Stripe recommends. A factory, so tests and CI run without a key.
        services.AddSingleton(_ => new StripeClient(
            configuration["Stripe:SecretKey"] ?? throw new InvalidOperationException("Stripe:SecretKey is not configured.")));
        services.AddScoped<IPaymentProvider, StripePaymentProvider>();
        services.AddScoped<IPaymentWebhookReader, StripeWebhookReader>();
        services.AddSingleton<IPaymentDashboard, StripeDashboard>();

        services.AddHttpClient<IImageStorage, SupabaseImageStorage>();
        services.AddHttpClient<IEmailSender, ResendEmailSender>();

        return services;
    }
}

