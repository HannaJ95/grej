using Grej.Application.Catalog;
using Grej.Application.Identity;
using Grej.Domain.Catalog;
using Grej.Domain.Orders;
using Grej.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Grej.Infrastructure.DemoData;

// Empties the shop and fills it with the content in demo-catalog.json. Started with
// `dotnet run --project Grej.Api -- reset-demo`. The local API and the deployed one use the
// same database and image storage, so this resets the deployed shop too. Identity's tables
// are not touched, so the admin account is kept.
public static class DemoSeeder
{
    public static async Task ResetAsync(IServiceProvider services)
    {
        // A command has to create its own scope, as in AdminSeeder.
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<GrejDbContext>();
        var storage = scope.ServiceProvider.GetRequiredService<IImageStorage>();
        var users = scope.ServiceProvider.GetRequiredService<UserManager<IdentityUser>>();

        // Every product is owned by the admin (constraints.md).
        var admin = (await users.GetUsersInRoleAsync(Roles.Admin)).FirstOrDefault()
            ?? throw new InvalidOperationException("There is no admin account. Run seed-admin first.");

        // Read before anything is changed, so a mistake in the file stops the reset here.
        var catalog = DemoCatalog.Load();

        // The old images' files, deleted at the end when nothing points to them.
        var oldPaths = await db.Set<ProductImage>().Select(image => image.StoragePath).ToListAsync();

        // Everything up to CommitAsync happens in one transaction. If something fails, nothing
        // is emptied, and the files uploaded so far are only unused.
        await using var transaction = await db.Database.BeginTransactionAsync();

        // TRUNCATE empties whole tables, and RESTART IDENTITY makes the ids start at 1 again.
        // Without CASCADE, PostgreSQL refuses if a table that is not in the list points to one
        // of these, so a table added later is never emptied without being added here.
        await db.Database.ExecuteSqlRawAsync("""
            TRUNCATE "OrderItems", "Payments", "Orders", "ProductImages", "ProductMaterials",
                "ProductColors", "Products", "Materials", "Colors", "Categories",
                "ProcessedWebhookEvents"
            RESTART IDENTITY
            """);
        await SeedAsync(db, storage, catalog, admin.Id);
        await transaction.CommitAsync();

        // Last, as in AdminProductService.SetImageAsync. DeleteAsync never throws, so at worst
        // an unused file is left.
        foreach (var path in oldPaths)
        {
            await storage.DeleteAsync(path, CancellationToken.None);
        }
    }

    // Fills an empty database. Kept apart from ResetAsync, so it can be tested without PostgreSQL.
    public static async Task SeedAsync(GrejDbContext db, IImageStorage storage, DemoCatalog catalog, string sellerId)
    {
        // Read first, so a broken image stops the seed before anything is uploaded.
        var images = catalog.Categories.ToDictionary(c => c.Name, c => DemoCatalog.ReadImage(c.Image));

        // Saved before the products, which need their ids. The dictionaries find them by name.
        var materials = catalog.Materials.ToDictionary(name => name, name => new Material { Name = name });
        var colors = catalog.Colors.ToDictionary(name => name, name => new Color { Name = name });
        var categories = catalog.Categories.ToDictionary(c => c.Name, c => new Category { Name = c.Name });
        // Found by main category and name, since two main categories may have a subcategory with
        // the same name. Parent is the main category object: EF Core saves it first and then
        // fills in ParentId with its new id, like it does for the products' categories below.
        var subcategories = catalog.Categories
            .SelectMany(c => (c.Subcategories ?? []).Select(name => (Main: c.Name, Name: name)))
            .ToDictionary(sub => sub, sub => new Category { Name = sub.Name, Parent = categories[sub.Main] });
        db.Materials.AddRange(materials.Values);
        db.Colors.AddRange(colors.Values);
        db.Categories.AddRange(categories.Values);
        db.Categories.AddRange(subcategories.Values);
        await db.SaveChangesAsync();

        // The first product of every category, then the second of every category, and so on.
        // The shop shows the newest (highest id) first, so its first page gets every category.
        var mixed = catalog.Categories
            .SelectMany(category => category.Products.Select((product, index) => (category, product, index)))
            .OrderBy(entry => entry.index);

        var products = new List<(Product Product, DemoCategory Category)>();
        foreach (var (demoCategory, demoProduct, _) in mixed)
        {
            var product = new Product
            {
                Title = demoProduct.Title,
                Description = demoProduct.Description,
                Price = demoProduct.Price,
                Stock = demoProduct.Stock,
                IsActive = demoProduct.IsActive,
                WeightGrams = demoProduct.Parcel.WeightGrams,
                LengthCm = demoProduct.Parcel.LengthCm,
                WidthCm = demoProduct.Parcel.WidthCm,
                HeightCm = demoProduct.Parcel.HeightCm,
                CategoryId = demoProduct.Subcategory is null
                    ? categories[demoCategory.Name].Id
                    : subcategories[(demoCategory.Name, demoProduct.Subcategory)].Id,
                SellerId = sellerId,
            };
            product.SetMaterials(demoProduct.Materials.Select(name => materials[name]));
            product.SetColors(demoProduct.Colors.Select(name => colors[name]));
            products.Add((product, demoCategory));
        }
        db.Products.AddRange(products.Select(entry => entry.Product));
        await db.SaveChangesAsync();

        // Every product gets its own copy of its category's image, at the same kind of path as
        // an upload in the CMS, since deleting a product in the CMS deletes its file.
        foreach (var (product, demoCategory) in products)
        {
            var image = images[demoCategory.Name];
            var path = $"products/{product.Id}/{Guid.NewGuid():N}{image.Extension}";
            var url = await storage.UploadAsync(path, image, CancellationToken.None);
            product.SetImage(url, path, demoCategory.ImageAltText);
        }
        await db.SaveChangesAsync();

        // Last, since the orders' rows point to the products' ids. Every title is unique
        // (DemoCatalogTests), so the products can be found by it.
        var productsByTitle = products.ToDictionary(entry => entry.Product.Title, entry => entry.Product);
        var now = DateTime.UtcNow;
        foreach (var demoOrder in catalog.Orders)
        {
            var order = CreateOrder(demoOrder, productsByTitle);
            var entry = db.Orders.Add(order);
            // Only Order can set CreatedAt, but EF Core can write any property through its
            // change tracker. Only the seed does this, so the demo orders get different days.
            entry.Property(o => o.CreatedAt).CurrentValue = now.AddDays(-demoOrder.DaysAgo);
        }
        await db.SaveChangesAsync();
    }

    // Built with the same methods as a real order: the checkout adds the rows, the shipping and
    // the payment, the webhook marks it as paid and stores the customer, and the admin ships or
    // cancels it.
    private static Order CreateOrder(DemoOrder demoOrder, Dictionary<string, Product> productsByTitle)
    {
        var order = new Order();
        var parcels = new List<ShippingItem>();
        foreach (var item in demoOrder.Items)
        {
            var product = productsByTitle[item.Product];
            order.AddItem(product.Id, product.Title, product.Price, item.Quantity);
            parcels.Add(new ShippingItem(product.WeightGrams, product.LengthCm, product.WidthCm, product.HeightCm, item.Quantity));
        }
        order.SetShipping(Shipping.Method, Shipping.CostFor(parcels));

        // Not a real Checkout session, so Stripe never sends a webhook for it, and it cannot
        // be refunded in Stripe. The reference must be unique (PaymentConfiguration).
        order.AddPayment("Demo", $"demo_{Guid.NewGuid():N}");
        order.Payment!.MarkAsPaid();
        order.SetCustomerDetails(demoOrder.Customer);

        if (demoOrder.Status == DemoOrderStatus.Shipped)
        {
            order.MarkAsShipped();
        }
        else if (demoOrder.Status == DemoOrderStatus.NeedsRefund)
        {
            order.CancelByAdmin();
        }

        return order;
    }
}
