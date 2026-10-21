using Grej.Domain.Payments;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Grej.Infrastructure.Persistence.Configurations;

// How Payment is stored in the database.
public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.Property(p => p.Provider).HasMaxLength(50);
        builder.Property(p => p.ProviderReference).HasMaxLength(255);
        // The webhook finds the payment by Stripe's session id, and one session is one payment.
        builder.HasIndex(p => p.ProviderReference).IsUnique();
        builder.Property(p => p.Status).HasConversion<string>().HasMaxLength(20);
        builder.Property(p => p.Amount).HasPrecision(10, 2);
        builder.Property(p => p.Currency).HasMaxLength(3);
    }
}
