using System.ComponentModel.DataAnnotations;

namespace Grej.Application.Orders;

// The query string of GET /api/admin/orders, e.g. ?all=true&page=2&search=anna.
public record OrderListQuery
{
    // The same upper limit as in ProductListQuery.
    [Range(1, 10_000)]
    public int Page { get; init; } = 1;

    [Range(1, 100)]
    public int PageSize { get; init; } = 20;

    // False gives only what the admin has to do, true every order (ambiguity.md).
    public bool All { get; init; }

    // Null = no search. It searches within the list that All chooses.
    [MaxLength(100)]
    public string? Search { get; init; }
}
