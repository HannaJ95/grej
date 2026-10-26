namespace Grej.Domain.Payments;

// A webhook event from the payment provider that has already been handled.
// Stored so an event that arrives twice is only handled once (constraints.md).
public class ProcessedWebhookEvent
{
    // The provider's id for the event (for Stripe: evt_…). The primary key.
    public string EventId { get; private set; } = "";
    public DateTime ProcessedAt { get; private set; } = DateTime.UtcNow;

    public ProcessedWebhookEvent(string eventId)
    {
        EventId = eventId;
    }

    // Used by EF Core when it reads a row from the database.
    private ProcessedWebhookEvent() { }
}
