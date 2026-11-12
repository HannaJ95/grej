using Grej.Application.Catalog;
using Grej.Application.Common;
using Grej.Domain.Catalog;
using Microsoft.EntityFrameworkCore;

namespace Grej.Infrastructure.Persistence.Repositories;

public class ProductRepository(GrejDbContext db) : IProductRepository
{
    public Task<Product?> GetByIdAsync(int id, CancellationToken cancellationToken) =>
        db.Products.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

    // One SQL query for all ids, instead of one query per product.
    public async Task<IReadOnlyList<Product>> GetByIdsAsync(IReadOnlyCollection<int> ids, CancellationToken cancellationToken) =>
        await db.Products.Where(p => ids.Contains(p.Id)).ToListAsync(cancellationToken);

    public Task<PagedResult<Product>> GetActivePageAsync(
        int page, int pageSize, ProductFilter filter, ProductSort sort, CancellationToken cancellationToken) =>
        ToPageAsync(Sorted(Matching(filter with { IsActive = true }), sort), page, pageSize, cancellationToken);

    // decimal? makes MAX return null instead of throwing when no product matches.
    public Task<decimal?> GetHighestActivePriceAsync(ProductFilter filter, CancellationToken cancellationToken) =>
        Matching(filter with { IsActive = true }).MaxAsync(p => (decimal?)p.Price, cancellationToken);

    public Task<PagedResult<Product>> GetPageAsync(
        int page, int pageSize, ProductFilter filter, ProductSort sort, CancellationToken cancellationToken) =>
        ToPageAsync(Sorted(Matching(filter), sort), page, pageSize, cancellationToken);

    // EXISTS in SQL: PostgreSQL stops at the first product it finds.
    public Task<bool> AnyInCategoryAsync(int categoryId, CancellationToken cancellationToken) =>
        db.Products.AnyAsync(p => p.CategoryId == categoryId, cancellationToken);

    public Task<IReadOnlyDictionary<int, int>> CountActiveByCategoryAsync(CancellationToken cancellationToken) =>
        CountPerCategoryAsync(db.Products.Where(p => p.IsActive), cancellationToken);

    public Task<IReadOnlyDictionary<int, int>> CountByCategoryAsync(CancellationToken cancellationToken) =>
        CountPerCategoryAsync(db.Products, cancellationToken);

    public void Add(Product product) => db.Products.Add(product);

    public void Remove(Product product) => db.Products.Remove(product);

    public async Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        await db.SaveChangesAsync(cancellationToken);
    }

    // Shared by the shop's page, its highest price and the CMS, so all filter the same way.
    private IQueryable<Product> Matching(ProductFilter filter)
    {
        IQueryable<Product> query = db.Products;

        if (filter.IsActive is { } isActive)
        {
            query = query.Where(p => p.IsActive == isActive);
        }

        if (filter.CategoryIds.Count > 0)
        {
            query = query.Where(p => filter.CategoryIds.Contains(p.CategoryId));
        }

        // EXISTS on the join table: the product has at least one of the chosen materials.
        if (filter.MaterialIds.Count > 0)
        {
            query = query.Where(p => p.Materials.Any(m => filter.MaterialIds.Contains(m.Id)));
        }

        if (filter.ColorIds.Count > 0)
        {
            query = query.Where(p => p.Colors.Any(c => filter.ColorIds.Contains(c.Id)));
        }

        if (filter.MinPrice is { } minPrice)
        {
            query = query.Where(p => p.Price >= minPrice);
        }

        if (filter.MaxPrice is { } maxPrice)
        {
            query = query.Where(p => p.Price <= maxPrice);
        }

        // One Where per word, so every word must match. Not EF.Functions.ILike, which only works
        // in PostgreSQL and not in the in-memory database the tests use.
        foreach (var word in filter.SearchWords)
        {
            query = query.Where(p => p.Title.ToLower().Contains(word.ToLower()));
        }

        return query;
    }

    private static async Task<IReadOnlyDictionary<int, int>> CountPerCategoryAsync(
        IQueryable<Product> query, CancellationToken cancellationToken) =>
        await query
            .GroupBy(p => p.CategoryId)
            .Select(group => new { CategoryId = group.Key, Count = group.Count() })
            .ToDictionaryAsync(row => row.CategoryId, row => row.Count, cancellationToken);

    // Without a fixed order PostgreSQL may return the rows in any order, and a product could show up
    // on two pages. So the id decides between equal prices. The id grows with every new product,
    // so it gives the same order as CreatedAt.
    private static IOrderedQueryable<Product> Sorted(IQueryable<Product> query, ProductSort sort) => sort switch
    {
        ProductSort.PriceAscending => query.OrderBy(p => p.Price).ThenByDescending(p => p.Id),
        ProductSort.PriceDescending => query.OrderByDescending(p => p.Price).ThenByDescending(p => p.Id),
        ProductSort.Oldest => query.OrderBy(p => p.Id),
        _ => query.OrderByDescending(p => p.Id),
    };

    // Takes an ordered query, so the paging is always stable.
    private static async Task<PagedResult<Product>> ToPageAsync(
        IOrderedQueryable<Product> query, int page, int pageSize, CancellationToken cancellationToken)
    {
        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<Product>(items, page, pageSize, totalCount);
    }
}
