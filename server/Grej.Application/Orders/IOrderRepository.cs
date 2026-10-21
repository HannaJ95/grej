using Grej.Domain.Orders;

namespace Grej.Application.Orders;

// What the application needs from the database to work with orders.
// Implemented in Infrastructure with EF Core (OrderRepository).
public interface IOrderRepository
{
    // Saves a new order together with its rows and payment, in one transaction.
    Task AddAsync(Order order, CancellationToken cancellationToken);
}
