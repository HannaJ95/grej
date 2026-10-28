using Grej.Domain.Catalog;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Grej.Infrastructure.Persistence.Configurations;

// How ProductImage is stored in the database.
public class ProductImageConfiguration : IEntityTypeConfiguration<ProductImage>
{
    public void Configure(EntityTypeBuilder<ProductImage> builder)
    {
        // Without this the table would be called "ProductImage", since it has no DbSet.
        builder.ToTable("ProductImages");
        // The same limit as in the CMS form and the API. Url and StoragePath are made
        // by the API, not typed by anyone, so they have no max length.
        builder.Property(i => i.AltText).HasMaxLength(200);
    }
}
