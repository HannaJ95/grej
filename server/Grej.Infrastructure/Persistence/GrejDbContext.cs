using Grej.Domain.Catalog;
using Grej.Domain.Orders;
using Grej.Domain.Payments;
using Microsoft.EntityFrameworkCore;

namespace Grej.Infrastructure.Persistence;

// EF Core's connection to the database. Each table is added as a DbSet<T>
// property, and migrations are generated from the model described here.
public class GrejDbContext(DbContextOptions<GrejDbContext> options) : DbContext(options)
{
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<Payment> Payments => Set<Payment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Picks up every IEntityTypeConfiguration in this project, e.g. ProductConfiguration.
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(GrejDbContext).Assembly);
    }
}

