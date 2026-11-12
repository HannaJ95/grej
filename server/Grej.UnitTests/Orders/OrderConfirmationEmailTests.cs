using Grej.Application.Orders;
using Grej.Domain.Orders;

namespace Grej.UnitTests.Orders;

public class OrderConfirmationEmailTests
{
    // The group separator in amounts, so a line never breaks inside one.
    private const char Space = ' ';

    [Fact]
    public void Create_GoesToCustomerWithOrderNumberInSubject()
    {
        var order = PaidOrder();

        var email = OrderConfirmationEmail.Create(order);

        Assert.Equal("anna@example.com", email.To);
        Assert.Equal($"Orderbekräftelse {order.OrderNumber}", email.Subject);
        Assert.Contains("Hej Anna Andersson!", email.Html);
        Assert.Contains("Storgatan 1<br>111 22 Stockholm", email.Html);
    }

    [Fact]
    public void Create_ShowsRowsShippingAndTotalInKronor()
    {
        var email = OrderConfirmationEmail.Create(PaidOrder());

        Assert.Contains("Skål, 2 st", email.Html);
        Assert.Contains("900 kr", email.Html);
        Assert.Contains("Frakt (Paket till ombud)", email.Html);
        Assert.Contains("129 kr", email.Html);
        Assert.Contains($"1{Space}029 kr", email.Html);
    }

    [Fact]
    public void Create_PriceWithOre_ShowsTwoDecimals()
    {
        var email = OrderConfirmationEmail.Create(PaidOrder(unitPrice: 1200.50m, quantity: 1));

        Assert.Contains($"1{Space}200,50 kr", email.Html);
    }

    [Fact]
    public void Create_TextFromCmsAndCheckout_IsNotHtml()
    {
        var order = PaidOrder(title: "Skål <b>stor</b>", name: "<script>Anna</script>");

        var email = OrderConfirmationEmail.Create(order);

        Assert.Contains("Skål &lt;b&gt;stor&lt;/b&gt;", email.Html);
        Assert.DoesNotContain("<script>", email.Html);
    }

    [Fact]
    public void Create_OrderFromBeforeShipping_HasNoShippingRow()
    {
        var email = OrderConfirmationEmail.Create(PaidOrder(withShipping: false));

        Assert.DoesNotContain("Frakt", email.Html);
    }

    [Fact]
    public void Create_OrderWithoutEmail_Throws()
    {
        var order = new Order();
        order.AddItem(productId: 1, title: "Skål", unitPrice: 450m, quantity: 1);

        Assert.Throws<InvalidOperationException>(() => OrderConfirmationEmail.Create(order));
    }

    private static Order PaidOrder(
        string title = "Skål", decimal unitPrice = 450m, int quantity = 2, string name = "Anna Andersson", bool withShipping = true)
    {
        var order = new Order();
        order.AddItem(productId: 1, title, unitPrice, quantity);
        if (withShipping)
        {
            order.SetShipping(Shipping.Method, 129m);
        }

        order.SetCustomerDetails(new CustomerDetails(name, "anna@example.com", "Storgatan 1", null, "111 22", "Stockholm", "SE"));
        return order;
    }
}
