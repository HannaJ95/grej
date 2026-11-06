using Grej.Domain.Catalog;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Grej.Infrastructure.Persistence.Configurations;

// How Category is stored in the database.
public class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        // Short enough for a menu in the shop. The API checks the same limit.
        builder.Property(c => c.Name).HasMaxLength(100);

        // A subcategory points to its main category in the same table. Restrict: the database
        // refuses to delete a category that has subcategories (constraints.md), the same way as
        // for products in ProductConfiguration.
        builder.HasOne(c => c.Parent)
            .WithMany()
            .HasForeignKey(c => c.ParentId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
