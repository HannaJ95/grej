using Grej.Domain.Catalog;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Grej.Infrastructure.Persistence.Configurations;

// How Product is stored in the database. Kept here instead of as attributes on
// the entity, so that the Domain project knows nothing about EF Core.
public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.Property(p => p.Title).HasMaxLength(200);
        // numeric(10,2) is exact, never floating point (constraints.md).
        builder.Property(p => p.Price).HasPrecision(10, 2);
        builder.Property(p => p.Currency).HasMaxLength(3);
        // Two webhooks at the same time could both read stock 1 and both save 0, which
        // would hide a double sale (constraints.md). With this, EF Core adds the stock it
        // read to the UPDATE's WHERE, so the second one saves nothing and throws instead.
        builder.Property(p => p.Stock).IsConcurrencyToken();
    }
}
