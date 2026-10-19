using Grej.Domain.Catalog;
using Microsoft.EntityFrameworkCore;

namespace Grej.Infrastructure.Persistence;

// Demo content for the first vertical slice, until products are created in
// the CMS (sprint 2). EF Core runs it after `dotnet ef database update`.
public static class DemoData
{
    public static void Seed(DbContext context)
    {
        // Runs on every database update, so only add the demo product once.
        if (context.Set<Product>().Any())
        {
            return;
        }

        context.Set<Product>().Add(new Product
        {
            Title = "Handgjord keramikskål",
            Description = "Drejad skål i stengods med blå glasyr.",
            Price = 450m,
            Stock = 1,
            IsActive = true,
        });
        context.SaveChanges();
    }
}
