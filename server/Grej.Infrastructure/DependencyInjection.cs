using Grej.Application.Catalog;
using Grej.Application.Identity;
using Grej.Application.Orders;
using Grej.Application.Payments;
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

        // ASP.NET Core Identity: users, roles and password hashing, stored with EF Core.
        // AddIdentityCore skips the cookie login that AddIdentity adds, since the API uses JWT.
        services.AddIdentityCore<IdentityUser>()
            .AddRoles<IdentityRole>()
            .AddEntityFrameworkStores<GrejDbContext>();
        services.AddScoped<ILoginService, IdentityLoginService>();

        services.AddScoped<IProductRepository, ProductRepository>();
        services.AddScoped<IOrderRepository, OrderRepository>();
        services.AddScoped<IPaymentRepository, PaymentRepository>();

        // One StripeClient for the whole API, as Stripe recommends. The factory only runs
        // the first time the client is needed, so tests and CI work without a Stripe key.
        // "Stripe:SecretKey" comes from User Secrets locally and Stripe__SecretKey in hosting.
        services.AddSingleton(_ => new StripeClient(
            configuration["Stripe:SecretKey"] ?? throw new InvalidOperationException("Stripe:SecretKey is not configured.")));
        services.AddScoped<IPaymentProvider, StripePaymentProvider>();
        services.AddScoped<IPaymentWebhookReader, StripeWebhookReader>();

        // A typed HttpClient: IHttpClientFactory gives SupabaseImageStorage an HttpClient
        // and reuses its connections, instead of opening new ones for every request.
        services.AddHttpClient<IImageStorage, SupabaseImageStorage>();

        return services;
    }
}

