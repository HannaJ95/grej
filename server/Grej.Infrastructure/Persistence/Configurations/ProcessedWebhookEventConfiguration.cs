using Grej.Domain.Payments;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Grej.Infrastructure.Persistence.Configurations;

// How ProcessedWebhookEvent is stored in the database.
public class ProcessedWebhookEventConfiguration : IEntityTypeConfiguration<ProcessedWebhookEvent>
{
    public void Configure(EntityTypeBuilder<ProcessedWebhookEvent> builder)
    {
        // Stripe's event id is the primary key, so the database itself
        // refuses to store the same event twice.
        builder.HasKey(e => e.EventId);
        builder.Property(e => e.EventId).HasMaxLength(255);
    }
}
