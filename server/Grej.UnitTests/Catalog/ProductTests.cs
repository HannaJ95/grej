using Grej.Domain.Catalog;

namespace Grej.UnitTests.Catalog;

public class ProductTests
{
    [Theory]
    [InlineData(1, false)]
    [InlineData(0, true)]
    [InlineData(-1, true)]
    public void IsSoldOut_DependsOnStock(int stock, bool expected)
    {
        var product = new Product { Title = "Skål", Stock = stock };

        Assert.Equal(expected, product.IsSoldOut);
    }

    [Fact]
    public void DecreaseStock_DecreasesByQuantity()
    {
        var product = new Product { Title = "Skål", Stock = 3 };

        product.DecreaseStock(2);

        Assert.Equal(1, product.Stock);
    }

    [Fact]
    public void DecreaseStock_LastItemSoldTwice_GoesBelowZero()
    {
        var product = new Product { Title = "Skål", Stock = 1 };

        product.DecreaseStock(1);
        product.DecreaseStock(1);

        Assert.Equal(-1, product.Stock);
        Assert.True(product.IsSoldOut);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void DecreaseStock_QuantityNotPositive_Throws(int quantity)
    {
        var product = new Product { Title = "Skål", Stock = 1 };

        Assert.Throws<ArgumentOutOfRangeException>(() => product.DecreaseStock(quantity));
        Assert.Equal(1, product.Stock);
    }

    [Fact]
    public void IncreaseStock_IncreasesByQuantity()
    {
        // Below 0 after the last item was sold twice. Cancelling one of the orders fixes it.
        var product = new Product { Title = "Skål", Stock = -1 };

        product.IncreaseStock(2);

        Assert.Equal(1, product.Stock);
        Assert.False(product.IsSoldOut);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void IncreaseStock_QuantityNotPositive_Throws(int quantity)
    {
        var product = new Product { Title = "Skål", Stock = 1 };

        Assert.Throws<ArgumentOutOfRangeException>(() => product.IncreaseStock(quantity));
        Assert.Equal(1, product.Stock);
    }

    [Fact]
    public void AddImage_ProductWithoutImage_MakesItTheMainImage()
    {
        var product = new Product { Title = "Skål" };

        var image = product.AddImage("https://example.com/a.png", "products/1/a.png", "En blå skål");

        Assert.Same(image, Assert.Single(product.Images));
        Assert.Same(image, product.MainImage);
        Assert.Equal("En blå skål", image.AltText);
    }

    [Fact]
    public void AddImage_ProductWithImages_PutsTheNewOneLast()
    {
        var product = ProductWithImages("a", "b");

        product.AddImage("https://example.com/c.png", "c", "C");

        Assert.Equal(["a", "b", "c"], Paths(product));
        Assert.Equal("a", product.MainImage?.StoragePath);
    }

    [Fact]
    public void AddImage_ProductWithTenImages_Throws()
    {
        var product = ProductWithImages("1", "2", "3", "4", "5", "6", "7", "8", "9", "10");

        Assert.False(product.HasRoomForImage);
        Assert.Throws<InvalidOperationException>(() => product.AddImage("https://example.com/11.png", "11", "Elva"));
        Assert.Equal(Product.MaxImages, product.Images.Count);
    }

    [Fact]
    public void RemoveImage_TheMainImage_MakesTheNextOneTheMainImage()
    {
        var product = ProductWithImages("a", "b", "c");

        var removed = product.RemoveImage(product.Images[0]);

        Assert.True(removed);
        Assert.Equal(["b", "c"], Paths(product));
        Assert.Equal("b", product.MainImage?.StoragePath);
    }

    [Fact]
    public void AddImage_AfterARemovedImage_StillPutsTheNewOneLast()
    {
        var product = ProductWithImages("a", "b", "c");
        product.RemoveImage(product.Images[1]);

        product.AddImage("https://example.com/d.png", "d", "D");

        Assert.Equal(["a", "c", "d"], Paths(product));
    }

    [Fact]
    public void RemoveImage_AnotherProductsImage_ReturnsFalse()
    {
        var product = ProductWithImages("a");
        var other = ProductWithImages("b");

        var removed = product.RemoveImage(other.Images[0]);

        Assert.False(removed);
        Assert.Equal(["a"], Paths(product));
    }

    [Fact]
    public void OrderImages_NewOrder_IsKeptAndChangesTheMainImage()
    {
        var product = ProductWithImages("a", "b", "c");
        var images = product.Images;

        var ordered = product.OrderImages([images[2], images[0], images[1]]);

        Assert.True(ordered);
        Assert.Equal(["c", "a", "b"], Paths(product));
        Assert.Equal("c", product.MainImage?.StoragePath);
    }

    [Fact]
    public void OrderImages_ListThatIsNotExactlyTheImages_ReturnsFalseAndChangesNothing()
    {
        var product = ProductWithImages("a", "b", "c");
        var images = product.Images;
        var other = ProductWithImages("d").Images[0];

        // One missing, one twice, and one from another product.
        Assert.False(product.OrderImages([images[1], images[0]]));
        Assert.False(product.OrderImages([images[1], images[1], images[0]]));
        Assert.False(product.OrderImages([images[2], images[1], other]));
        Assert.Equal(["a", "b", "c"], Paths(product));
    }

    [Fact]
    public void SetMaterials_ReplacesTheOldMaterials()
    {
        var product = new Product { Title = "Skål" };
        var clay = new Material { Name = "Lera" };
        var glass = new Material { Name = "Glas" };
        product.SetMaterials([clay]);

        product.SetMaterials([glass]);

        Assert.Same(glass, Assert.Single(product.Materials));
    }

    [Fact]
    public void SetColors_EmptyList_RemovesAllColors()
    {
        var product = new Product { Title = "Skål" };
        product.SetColors([new Color { Name = "Blå" }, new Color { Name = "Vit" }]);

        product.SetColors([]);

        Assert.Empty(product.Colors);
    }

    // The storage path is enough to tell the images apart.
    private static Product ProductWithImages(params string[] paths)
    {
        var product = new Product { Title = "Skål" };
        foreach (var path in paths)
        {
            product.AddImage($"https://example.com/{path}.png", path, $"Bild {path}");
        }
        return product;
    }

    private static List<string> Paths(Product product) =>
        product.Images.Select(image => image.StoragePath).ToList();
}
