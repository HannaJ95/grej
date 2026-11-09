namespace Grej.Application.Catalog;

// What the shop's product list is filtered on. "Or" within a list, "and" between them
// (ambiguity.md). An empty list or a null price means no filter, and both prices are included.
public record ProductFilter
{
    public IReadOnlyCollection<int> CategoryIds { get; init; } = [];
    public IReadOnlyCollection<int> MaterialIds { get; init; } = [];
    public IReadOnlyCollection<int> ColorIds { get; init; } = [];
    public decimal? MinPrice { get; init; }
    public decimal? MaxPrice { get; init; }

    // Every word must be somewhere in the title, in any case (ambiguity.md).
    public IReadOnlyCollection<string> SearchWords { get; init; } = [];
}
