using Grej.Application.Common;
using Grej.Domain.Orders;

namespace Grej.Application.Orders;

public interface IOrderRepository
{
    // The order, its rows and its payment in one transaction.
    Task AddAsync(Order order, CancellationToken cancellationToken);

    // With the rows and the payment.
    Task<Order?> GetByIdAsync(int id, CancellationToken cancellationToken);

    // By the payment's ProviderReference (the Checkout session id), with the rows and the payment.
    Task<Order?> GetByPaymentReferenceAsync(string reference, CancellationToken cancellationToken);

    // For the CMS. all = false: what the admin has to do, oldest first; all = true: every order,
    // newest first. Every search word must be in the number, the customer's name or email, or a row's title.
    Task<PagedResult<Order>> GetPageAsync(
        bool all, IReadOnlyCollection<string> searchWords, int page, int pageSize, CancellationToken cancellationToken);

    // Whatever the order's status.
    Task<bool> ContainsProductAsync(int productId, CancellationToken cancellationToken);

    // Together with the request's other changes (e.g. the stock), in one transaction.
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
