namespace Grej.Domain.Orders;

// The customer's name, email and shipping address, as collected by the payment
// provider (Stripe Checkout). Customers buy as guests, so this is all we know about them.
public record CustomerDetails(
    string Name,
    string Email,
    string AddressLine1,
    string? AddressLine2,
    string PostalCode,
    string City,
    string Country);
