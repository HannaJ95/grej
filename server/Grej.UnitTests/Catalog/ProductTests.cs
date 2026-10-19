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
}
