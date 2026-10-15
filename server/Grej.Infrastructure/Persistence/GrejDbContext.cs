using Microsoft.EntityFrameworkCore;

namespace Grej.Infrastructure.Persistence;

// EF Core's connection to the database. Each table is added as a DbSet<T>
// property, and migrations are generated from the model described here.
public class GrejDbContext(DbContextOptions<GrejDbContext> options) : DbContext(options)
{
}
