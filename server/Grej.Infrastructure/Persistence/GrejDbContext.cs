using Grej.Domain.Catalog;
using Microsoft.EntityFrameworkCore;

namespace Grej.Infrastructure.Persistence;

// EF Core's connection to the database. Each table is added as a DbSet<T>
// property, and migrations are generated from the model described here.
public class GrejDbContext(DbContextOptions<GrejDbContext> options) : DbContext(options)
{
    public DbSet<Product> Products => Set<Product>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Picks up every IEntityTypeConfiguration in this project, e.g. ProductConfiguration.
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(GrejDbContext).Assembly);
    }
}

