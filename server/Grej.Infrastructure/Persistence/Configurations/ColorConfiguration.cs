using Grej.Domain.Catalog;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Grej.Infrastructure.Persistence.Configurations;

// How Color is stored in the database, the same way as Material.
public class ColorConfiguration : IEntityTypeConfiguration<Color>
{
    public void Configure(EntityTypeBuilder<Color> builder)
    {
        builder.Property(c => c.Name).HasMaxLength(100);
    }
}
