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
}
