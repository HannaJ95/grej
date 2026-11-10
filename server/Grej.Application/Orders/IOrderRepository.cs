using Grej.Application.Common;
using Grej.Domain.Orders;

namespace Grej.Application.Orders;

public interface IOrderRepository
{
    // Saves a new order together with its rows and payment, in one transaction.
    Task AddAsync(Order order, CancellationToken cancellationToken);

    // Null if no order has this id. The order's rows and payment are included.
    Task<Order?> GetByIdAsync(int id, CancellationToken cancellationToken);

    // One page of orders with their payments, for the CMS. all = false gives only what the admin
    // has to do, oldest first; all = true every order, newest first. Every search word must be
    // in the order number, the customer's name or email, or a row's title, in any case.
    Task<PagedResult<Order>> GetPageAsync(
        bool all, IReadOnlyCollection<string> searchWords, int page, int pageSize, CancellationToken cancellationToken);

    // True if any order, whatever its status, has a row with this product.
    Task<bool> ContainsProductAsync(int productId, CancellationToken cancellationToken);

    // Saves the changes made to orders fetched above, together with all other changes
    // in the same request (e.g. the stock), in one transaction. Like IPaymentRepository.
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
