using Grej.Domain.Catalog;
using Grej.Domain.Orders;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Grej.Infrastructure.Persistence.Configurations;

// How OrderItem is stored in the database.
public class OrderItemConfiguration : IEntityTypeConfiguration<OrderItem>
{
    public void Configure(EntityTypeBuilder<OrderItem> builder)
    {
        // Without this the table would be called "OrderItem", since it has no DbSet.
        builder.ToTable("OrderItems");
        builder.Property(i => i.TitleAtPurchase).HasMaxLength(200);
        builder.Property(i => i.UnitPrice).HasPrecision(10, 2);

        // Restrict: the database refuses to delete a product that is on an order,
        // so it can only be hidden (IsActive = false), as constraints.md says.
        builder.HasOne<Product>().WithMany().HasForeignKey(i => i.ProductId).OnDelete(DeleteBehavior.Restrict);
    }
}
