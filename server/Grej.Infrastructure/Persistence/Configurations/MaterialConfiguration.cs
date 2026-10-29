using Grej.Domain.Catalog;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Grej.Infrastructure.Persistence.Configurations;

// How Material is stored in the database. Its link to products is in ProductConfiguration.
public class MaterialConfiguration : IEntityTypeConfiguration<Material>
{
    public void Configure(EntityTypeBuilder<Material> builder)
    {
        // The same limit as for categories. The API checks it too.
        builder.Property(m => m.Name).HasMaxLength(100);
    }
}
