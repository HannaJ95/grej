using System.ComponentModel.DataAnnotations;

namespace Grej.Application.Orders;

// The query string of GET /api/admin/orders, e.g. ?all=true&page=2.
public record OrderListQuery
{
    // The same upper limit as in ProductListQuery.
    [Range(1, 10_000)]
    public int Page { get; init; } = 1;

    [Range(1, 100)]
    public int PageSize { get; init; } = 20;

    // False (the default) gives only what the admin has to do: paid orders that are not
    // shipped yet. True gives every order, also unpaid and cancelled ones (ambiguity.md).
    public bool All { get; init; }
}
