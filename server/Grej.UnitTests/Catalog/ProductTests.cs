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
    public void SetImage_ProductWithoutImage_MakesItTheMainImage()
    {
        var product = new Product { Title = "Skål" };

        var old = product.SetImage("https://example.com/a.png", "products/1/a.png", "En blå skål");

        Assert.Null(old);
        var image = Assert.Single(product.Images);
        Assert.Same(image, product.MainImage);
        Assert.Equal("En blå skål", image.AltText);
    }

    [Fact]
    public void SetImage_ProductWithImage_ReplacesItAndReturnsTheOldOne()
    {
        var product = new Product { Title = "Skål" };
        product.SetImage("https://example.com/a.png", "products/1/a.png", "Gammal bild");

        var old = product.SetImage("https://example.com/b.png", "products/1/b.png", "Ny bild");

        // The old image is returned, so its file can be deleted.
        Assert.Equal("products/1/a.png", old?.StoragePath);
        Assert.Equal("products/1/b.png", Assert.Single(product.Images).StoragePath);
    }

    [Fact]
    public void RemoveImage_ReturnsTheRemovedImage()
    {
        var product = new Product { Title = "Skål" };
        product.SetImage("https://example.com/a.png", "products/1/a.png", "En blå skål");

        var removed = product.RemoveImage();

        Assert.Equal("products/1/a.png", removed?.StoragePath);
        Assert.Empty(product.Images);
        Assert.Null(product.MainImage);
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
}
