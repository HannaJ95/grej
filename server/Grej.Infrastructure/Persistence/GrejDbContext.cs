using Grej.Domain.Catalog;
using Grej.Domain.Orders;
using Grej.Domain.Payments;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Grej.Infrastructure.Persistence;

// EF Core's connection to the database. Each table is added as a DbSet<T>
// property, and migrations are generated from the model described here.
// IdentityDbContext adds ASP.NET Core Identity's tables for users and roles.
public class GrejDbContext(DbContextOptions<GrejDbContext> options) : IdentityDbContext(options)
{
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<ProcessedWebhookEvent> ProcessedWebhookEvents => Set<ProcessedWebhookEvent>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Identity describes its own tables here, so this must run first.
        base.OnModelCreating(modelBuilder);

        // Picks up every IEntityTypeConfiguration in this project, e.g. ProductConfiguration.
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(GrejDbContext).Assembly);
    }
}

