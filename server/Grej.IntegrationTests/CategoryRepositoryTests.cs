using Grej.Domain.Catalog;
using Grej.Infrastructure.Persistence;
using Grej.Infrastructure.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Grej.IntegrationTests;

// Tests a query in CategoryRepository with EF Core's in-memory database, like ProductRepositoryTests.
public class CategoryRepositoryTests
{
    // A new empty database for each test, since xUnit creates a new instance for each test.
    private readonly GrejDbContext db = new(new DbContextOptionsBuilder<GrejDbContext>()
        .UseInMemoryDatabase(Guid.NewGuid().ToString())
        .Options);

    [Fact]
    public async Task GetSubcategoryIds_ReturnsOnlyTheSubcategoriesOfTheGivenMainCategories()
    {
        db.Categories.AddRange(
            new Category { Id = 1, Name = "Keramik" },
            new Category { Id = 2, Name = "Textil" },
            new Category { Id = 3, Name = "Skålar", ParentId = 1 },
            new Category { Id = 4, Name = "Vaser", ParentId = 1 },
            new Category { Id = 5, Name = "Dukar", ParentId = 2 });
        await db.SaveChangesAsync();

        var ids = await new CategoryRepository(db).GetSubcategoryIdsAsync([1], CancellationToken.None);

        Assert.Equal([3, 4], ids.Order());
    }
}
