using Grej.Domain.Catalog;
using Microsoft.AspNetCore.Identity;
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

        // A product has many images; each image has the product's id in ProductId. When a
        // product is deleted, the database deletes its image rows too (cascade). The files
        // in Supabase Storage are deleted by AdminProductService.
        builder.HasMany(p => p.Images).WithOne().HasForeignKey(i => i.ProductId);
        // Every query for products also fetches their images, since both the shop and the
        // CMS show them. Without this, Images would be empty unless a query asks for them.
        builder.Navigation(p => p.Images).AutoInclude();

        // Many-to-many: a product has several materials, and a material is on several products.
        // The join table has one row per pair, e.g. (ProductId 7, MaterialId 2). The two lambdas
        // name its foreign keys; without them EF Core would call them "MaterialsId" and "ProductsId".
        // Deleting a product or a material deletes its rows here too (cascade, the default), so a
        // deleted material simply disappears from its products.
        builder.HasMany(p => p.Materials).WithMany(m => m.Products).UsingEntity(
            "ProductMaterials",
            material => material.HasOne(typeof(Material)).WithMany().HasForeignKey("MaterialId"),
            product => product.HasOne(typeof(Product)).WithMany().HasForeignKey("ProductId"));
        builder.HasMany(p => p.Colors).WithMany(c => c.Products).UsingEntity(
            "ProductColors",
            color => color.HasOne(typeof(Color)).WithMany().HasForeignKey("ColorId"),
            product => product.HasOne(typeof(Product)).WithMany().HasForeignKey("ProductId"));
        // Fetched with every product, like the images. The CMS form and the product page show
        // them, and SetMaterials/SetColors must see the old rows to know which ones to delete.
        builder.Navigation(p => p.Materials).AutoInclude();
        builder.Navigation(p => p.Colors).AutoInclude();

        // Restrict: the database refuses to delete a category that has products (constraints.md).
        // AdminCategoryService checks it first and answers 409; this also stops a delete while a
        // product is being saved into the category. HasOne<Category>() needs no property on Product.
        builder.HasOne<Category>().WithMany().HasForeignKey(p => p.CategoryId).OnDelete(DeleteBehavior.Restrict);

        // The owner is a user in Identity's AspNetUsers table. The Domain project knows nothing
        // about Identity, so the link is only described here. Restrict: a user who owns products
        // cannot be deleted.
        builder.HasOne<IdentityUser>().WithMany().HasForeignKey(p => p.SellerId).OnDelete(DeleteBehavior.Restrict);
    }
}
