using Grej.Domain.Orders;

namespace Grej.Application.Orders;

// What the application needs from the database to work with orders.
// Implemented in Infrastructure with EF Core (OrderRepository).
public interface IOrderRepository
{
    // Saves a new order together with its rows and payment, in one transaction.
    Task AddAsync(Order order, CancellationToken cancellationToken);

    // Null if no order has this id. The order's rows are included.
    Task<Order?> GetByIdAsync(int id, CancellationToken cancellationToken);

    // True if any order, whatever its status, has a row with this product.
    Task<bool> ContainsProductAsync(int productId, CancellationToken cancellationToken);
}
