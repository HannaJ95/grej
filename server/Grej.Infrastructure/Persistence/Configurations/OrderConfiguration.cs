using Grej.Domain.Orders;
using Grej.Domain.Payments;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Grej.Infrastructure.Persistence.Configurations;

// How Order is stored in the database. Same pattern as ProductConfiguration.
public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.Property(o => o.OrderNumber).HasMaxLength(20);
        // The order number is shown to the customer, so two orders must never share one.
        builder.HasIndex(o => o.OrderNumber).IsUnique();
        // Stored as text ("Pending") instead of a number, so rows are readable in Supabase.
        builder.Property(o => o.Status).HasConversion<string>().HasMaxLength(20);
        builder.Property(o => o.Total).HasPrecision(10, 2);
        builder.Property(o => o.Currency).HasMaxLength(3);

        // An order has many rows; each row has the order's id in OrderId.
        builder.HasMany(o => o.Items).WithOne().HasForeignKey(i => i.OrderId);

        // One payment per order. The foreign key (OrderId) is on the payment.
        builder.HasOne(o => o.Payment).WithOne().HasForeignKey<Payment>(p => p.OrderId);
    }
}
