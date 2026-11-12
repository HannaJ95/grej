using System.Globalization;
using System.Text.Encodings.Web;
using System.Text.Unicode;
using Grej.Application.Common;
using Grej.Domain.Orders;

namespace Grej.Application.Orders;

// Mail programs drop <style>, so every style is inline.
public static class OrderConfirmationEmail
{
    // Not sv-SE, whose separators depend on the machine's culture data.
    private static readonly NumberFormatInfo SwedishNumbers = new()
    {
        NumberGroupSeparator = " ",
        NumberDecimalSeparator = ",",
    };

    // All ranges, so "å" stays as it is instead of "&#229;".
    private static readonly HtmlEncoder Html = HtmlEncoder.Create(UnicodeRanges.All);

    private const string Line = "border-bottom:1px solid #cfc4b2";

    public static EmailMessage Create(Order order)
    {
        var to = order.CustomerEmail
            ?? throw new InvalidOperationException($"Order {order.OrderNumber} has no email.");

        var rows = string.Concat(order.Items.Select(item =>
            Row($"{Encode(item.TitleAtPurchase)}, {item.Quantity} st", Money(item.LineTotal))));
        // Orders from before shipping was built have none.
        if (order.ShippingCost is { } shippingCost)
        {
            rows += Row($"Frakt ({Encode(order.ShippingMethod)})", Money(shippingCost));
        }

        var greeting = order.CustomerName is { } name ? $"Hej {Encode(name)}!" : "Hej!";

        var html = $"""
            <div style="margin:0;padding:32px 16px;background:#f8f3ea;color:#2b2a27;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.5">
              <div style="max-width:600px;margin:0 auto">
                <p style="margin:0 0 32px;font-size:28px;font-weight:bold">GREJ.</p>
                <h1 style="margin:0 0 16px;font-size:24px">Tack för din beställning!</h1>
                <p style="margin:0 0 8px">{greeting}</p>
                <p style="margin:0 0 24px">Betalningen är klar. Ordernummer {order.OrderNumber}.</p>
                <table style="width:100%;margin:0 0 24px;border-collapse:collapse">
                  {rows}
                  <tr>
                    <td style="padding:12px 0 0;font-weight:bold">Totalt</td>
                    <td style="padding:12px 0 0;font-weight:bold;text-align:right;white-space:nowrap">{Money(order.Total)}</td>
                  </tr>
                </table>
                {Address(order)}
                <h2 style="margin:0 0 8px;font-size:18px">Vad händer nu?</h2>
                <p style="margin:0 0 24px">Vi packar din grej inom 1–2 arbetsdagar. Sedan skickas paketet med PostNord, och du hämtar ut det hos ditt ombud.</p>
                <p style="margin:0;color:#66635d;font-size:14px">Det här är en demobutik. Betalningen gjordes i Stripes testläge, så inga riktiga pengar har dragits och inget paket skickas.</p>
              </div>
            </div>
            """;

        return new EmailMessage(to, $"Orderbekräftelse {order.OrderNumber}", html);
    }

    private static string Row(string label, string amount) =>
        $"""<tr><td style="padding:8px 0;{Line}">{label}</td><td style="padding:8px 0;{Line};text-align:right;white-space:nowrap">{amount}</td></tr>""";

    private static string Address(Order order)
    {
        if (order.AddressLine1 is null)
        {
            return "";
        }

        var lines = new[] { order.CustomerName, order.AddressLine1, order.AddressLine2, $"{order.PostalCode} {order.City}" }
            .Where(line => !string.IsNullOrWhiteSpace(line))
            .Select(Encode);

        return $"""
            <h2 style="margin:0 0 8px;font-size:18px">Levereras till</h2>
            <p style="margin:0 0 24px">{string.Join("<br>", lines)}</p>
            """;
    }

    // Titles come from the CMS and names from Checkout, so they must never become HTML.
    private static string Encode(string? text) => Html.Encode(text ?? "");

    // Öre only when there are any: "1 299 kr", "1 299,50 kr".
    private static string Money(decimal amount) =>
        amount.ToString(amount % 1 == 0 ? "#,0" : "#,0.00", SwedishNumbers) + " kr";
}
