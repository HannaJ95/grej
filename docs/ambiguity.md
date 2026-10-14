# Ambiguity – GREJ

Questions where the requirements could be read in more than one way, and how they were decided. What is built is in [scope.md](scope.md), the rules that follow from these decisions are in [constraints.md](constraints.md).

## Customers and accounts

**Do customers need an account to buy?**
Decision: No. Customers buy as guests and give name, email and address in Stripe Checkout.
Why: Customer accounts add login, passwords and personal data handling for little gain in a small shop.

**Can a customer see their order history?**
Decision: No, not in this version (requires customer accounts).

**What does the customer get as confirmation?**
Decision: The success page shows an order number. Email confirmation is Could.
Why: Stripe does not send receipts in test mode, so the success page is the only confirmation in the MVP.

## Cart

**Where is the cart stored?**
Decision: In the browser (localStorage). No login is needed and it survives a page reload.
Why: Guests have no account to store a cart on. The API never trusts prices from the cart (see constraints).

**What happens to the cart after a successful payment?**
Decision: It is emptied when the customer reaches the success page.

**Is there a max quantity per product in the cart?**
Decision: Limited by stock.

## Products

**Is a product unique (one item) or can there be several of the same?**
Decision: Each product has a stock count, so both are possible (unique art = stock 1).

**What happens to a sold-out product?**
Decision: It is still shown, marked as "Sold", and cannot be added to the cart.
Why: Sold unique pieces work as a portfolio for the artist.

**Can the admin save a product without showing it in the shop?**
Decision: Yes. A product can be inactive (`IsActive = false`), which works both as a draft and as a hidden product.

**Product properties (material, color): fixed fields or created by the admin?**
Decision: The admin creates the lists of materials and colors in the CMS, and each product picks from them.
Why: More flexible than fixed fields, simpler than fully custom properties.

**Can a product have several colors and materials?**
Decision: Yes, several of each.
Why: Handmade items are often multi-colored, e.g. a bowl that is red, white and blue.

**How does filtering on several colors or materials work?**
Decision (Should): Within one property it is "or", between properties it is "and". Filtering on red + blue shows everything that is red or blue. Filtering on red + ceramics shows everything that is red and made of ceramics.
Why: This is how most webshops work, and a red, white and blue bowl is found whichever of its colors the customer picks.

**Can a product have several images?**
Decision (Should): Yes, up to 10. The MVP has one image per product.

## Categories

**Can a product belong to several categories?**
Decision: No, one category per product.
Why: Simpler data model and filtering. Subcategories cover the need for grouping.

**Can categories have subcategories?**
Decision (Should): Yes, one level. A category can have any number of subcategories (e.g. Ceramics → Plates, Cups, Bowls, Candle holders, Other), but a subcategory cannot have its own subcategories. The admin creates both in the CMS.
Why: One level covers the need. Deeper trees make the CMS, the menu and the filtering much more complex.

**What is shown when the customer selects a category?**
Decision (Should): All products in the category and its subcategories. The subcategories are shown as filters.

**What happens to products if the admin deletes a category?**
Decision: A category that has products or subcategories cannot be deleted. Its products must be moved, and its subcategories deleted, first.
Why: Products must always have a category, and nothing should disappear by accident.

## Orders

**What does "update order" mean for the admin?**
Decision: Only changing the order status (`Pending` → `Shipped` or `Cancelled`). The admin never changes the payment status, products or prices on an order.

**Which orders does the admin see first?**
Decision: By default the list shows orders that are paid but not shipped, i.e. what needs to be done. All orders can be shown with a filter.
Why: Cancelled and expired orders are never deleted, so the list grows over time.

**Does cancelling an order refund the customer?**
Decision: Not automatically. The admin refunds in the Stripe dashboard, Stripe notifies the API, and the payment becomes `Refunded`. Cancelling an order that has not been shipped increases the stock again; the refund itself never changes the stock.
Why: Automatic refunds are more code and more risk, and refunds are rare in a small shop.

## Shipping, money and countries

**How are orders shipped?**
Decision: The admin packs and sends the order manually (e.g. at a postal agent) and then marks it as `Shipped` in the CMS. There is no integration with a shipping company.

**Is there a shipping cost?**
Decision: Not in the MVP, where the shipping cost is included in the product price. As a Should, it is one fixed price shown as its own row in Stripe Checkout, and the order stores the shipping method, cost and currency.
Why: Storing shipping on the order means more shipping methods or prices per country can be added later without changing old orders.

**Which currency?**
Decision: SEK only, but every price, order and payment stores its currency.
Why: More currencies can be added later without changing stored data.

**Which countries can customers order to?**
Decision: Sweden only. Stripe Checkout only allows Swedish addresses, and the address is stored with its country.
Why: Selling abroad mainly requires VAT and legal work (Won't), not code. Storing the country costs nothing now.

## Future idea – marketplace with sellers

Not planned (see scope). Kept here so the decisions already made are not lost.

**Can anyone register as a seller, or does the admin approve them?**
Decision: Anyone can register; the admin approves before their products are shown.

**What happens to a seller's products if the seller is blocked?**
Decision: The products are hidden, existing orders are kept.

**An order contains products from several sellers. Who ships, how many shipping costs are there, and when is the order shipped?**
Decision: Open. Must be decided before the marketplace is started.

**How do sellers get their money (e.g. with Stripe Connect)?**
Decision: Open. Must be decided before the marketplace is started.
