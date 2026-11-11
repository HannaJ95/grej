using Grej.Domain.Catalog;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Grej.Infrastructure.Persistence.Configurations;

// Here instead of as attributes on Product, so the Domain project knows nothing about EF Core.
public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.Property(p => p.Title).HasMaxLength(200);
        // Exact, never floating point (constraints.md).
        builder.Property(p => p.Price).HasPrecision(10, 2);
        builder.Property(p => p.Currency).HasMaxLength(3);
        // Up to 999.9 cm with one decimal, e.g. a ring of 1.8 cm (constraints.md).
        builder.Property(p => p.ItemLengthCm).HasPrecision(4, 1);
        builder.Property(p => p.ItemWidthCm).HasPrecision(4, 1);
        builder.Property(p => p.ItemHeightCm).HasPrecision(4, 1);
        builder.Property(p => p.ItemDiameterCm).HasPrecision(4, 1);
        // Two webhooks at the same time could both read stock 1 and both save 0, which would
        // hide a double sale (constraints.md). The second save throws instead.
        builder.Property(p => p.Stock).IsConcurrencyToken();

        // Deleting a product deletes its image rows. AdminProductService deletes the files.
        builder.HasMany(p => p.Images).WithOne().HasForeignKey(i => i.ProductId);
        // Both the shop and the CMS show them.
        builder.Navigation(p => p.Images).AutoInclude();

        // Without the lambdas EF Core would name the keys "MaterialsId" and "ProductsId".
        builder.HasMany(p => p.Materials).WithMany(m => m.Products).UsingEntity(
            "ProductMaterials",
            material => material.HasOne(typeof(Material)).WithMany().HasForeignKey("MaterialId"),
            product => product.HasOne(typeof(Product)).WithMany().HasForeignKey("ProductId"));
        builder.HasMany(p => p.Colors).WithMany(c => c.Products).UsingEntity(
            "ProductColors",
            color => color.HasOne(typeof(Color)).WithMany().HasForeignKey("ColorId"),
            product => product.HasOne(typeof(Product)).WithMany().HasForeignKey("ProductId"));
        // SetMaterials and SetColors must see the old rows to know which ones to delete.
        builder.Navigation(p => p.Materials).AutoInclude();
        builder.Navigation(p => p.Colors).AutoInclude();

        // A category with products cannot be deleted (constraints.md). AdminCategoryService
        // checks first; this also stops a delete while a product is saved into the category.
        builder.HasOne<Category>().WithMany().HasForeignKey(p => p.CategoryId).OnDelete(DeleteBehavior.Restrict);

        // The Domain project knows nothing about Identity. A user who owns products cannot be deleted.
        builder.HasOne<IdentityUser>().WithMany().HasForeignKey(p => p.SellerId).OnDelete(DeleteBehavior.Restrict);
    }
}
