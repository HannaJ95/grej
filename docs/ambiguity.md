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
Decision: Yes, several of each, or none.
Why: Handmade items are often multi-colored, e.g. a bowl that is red, white and blue.

**What happens to products if the admin deletes a material or a color?**
Decision: It is deleted and removed from the products that have it; the products stay. If products have it, the CMS first says how many and asks the admin to confirm.
Why: Unlike a category, a product does not need a material or a color, so nothing breaks. The warning lets the admin cancel and check the products first, instead of finding out afterwards.

**How does filtering on several colors or materials work?**
Decision (Should): Within one property it is "or", between properties it is "and". Filtering on red + blue shows everything that is red or blue. Filtering on red + ceramics shows everything that is red and made of ceramics.
Why: This is how most webshops work, and a red, white and blue bowl is found whichever of its colors the customer picks.

**What range does the price filter have?**
Decision (Should): From 0 to the highest price among the products that match the customer's other choices, rounded up to 100 kr. The ends mean no limit.
Why: This is how most webshops work. The scale fits the chosen category, but ignores the price itself, so it does not shrink while the customer drags.

**What does the search look in?**
Decision (Should): Only the product's title. Every word must be somewhere in the title, in upper or lower case: "ljusstake ek" finds "Ljusstake i ek". The search is part of the filter: it combines with the other choices as "and", counts as one choice, and "Rensa" removes it.
Why: The scope says "by name", and a description often mentions other things, like "passar som vas" on a mug. Each new word narrows the result, which is what a customer who adds a word expects.

**How can the product list be sorted?**
Decision (Should): Newest first (the default), lowest price first or highest price first. Products with the same price come newest first, and sold-out products are sorted like the others. The sort is not a filter: it does not count as a choice, and "Rensa", the chips and the tabs keep it. A new sort starts on page 1.
Why: Date and price are what the shop has data for. There are no ratings or sales numbers to sort on by popularity. A fixed order for equal prices keeps a product from showing up on two pages.

**How does the admin find products in the CMS?**
Decision (Should): A search in the title, like the shop's, and one menu each for category, material, color, visibility (all, shown or hidden) and sort (newest, oldest, lowest or highest price). One choice per menu; a main category includes its subcategories' products. The list shows the day each product was added. The product counts on the category, material and color pages open the list with that choice made.
Why: In the CMS the admin usually looks for one thing at a time, e.g. the hidden products or everything in Keramik, as in Shopify's and WooCommerce's product lists. A native select per filter was faster to build and accessible from the start; several choices at once, like the shop's checkboxes, would need its own popup and is left as an improvement.

**Can a product have several images?**
Decision (Should): Yes, up to 10. The MVP had one image per product.

**Which image is shown in the lists, and who decides the order?**
Decision (Should): The first image is the main image, which the product list, the start page, the cart and the CMS's list show. The product page shows all of them, in order. A new image goes last, and the admin moves the images up and down in the CMS. On "Ny produkt" the admin chooses one image, which becomes the main image, and adds the others on the product's page after saving.
Why: The main image is what most customers see, so the admin must be able to choose it. Moving up and down also sets the order of the gallery, and works with the keyboard and on a phone, unlike dragging.

## Categories

**Can a product belong to several categories?**
Decision: No, one category per product.
Why: Simpler data model and filtering. Subcategories cover the need for grouping.

**Can categories have subcategories?**
Decision (Should): Yes, one level. A category can have any number of subcategories (e.g. Ceramics → Plates, Cups, Bowls, Candle holders, Other), but a subcategory cannot have its own subcategories. The admin creates both in the CMS.
Why: One level covers the need. Deeper trees make the CMS, the menu and the filtering much more complex.

**Can a product be placed in a main category that has subcategories?**
Decision (Should): Yes. A product can be in any category, a main category or a subcategory, e.g. a jug directly in Ceramics next to Plates and Cups.
Why: Simpler rules, and nothing breaks when the admin adds a subcategory later.

**What is shown when the customer selects a category?**
Decision (Should): All products in the category and its subcategories. Once the main category is ticked, its subcategories are shown under it as filters. If the customer also ticks one of them, only the chosen subcategories are shown. Unticking the main category unticks its subcategories.
Why: The main category says where the customer is, and the subcategories narrow it down, which is how most webshops work.

**What happens to products if the admin deletes a category?**
Decision: A category that has products or subcategories cannot be deleted. Its products must be moved, and its subcategories deleted, first.
Why: Products must always have a category, and nothing should disappear by accident.

## Orders

**What does "update order" mean for the admin?**
Decision: Only changing the order status (`Pending` → `Shipped` or `Cancelled`). The admin never changes the payment status, products or prices on an order.

**Which orders does the admin see first?**
Decision: By default the list shows orders that are paid but not shipped, i.e. what needs to be done: orders to ship, and cancelled orders that need a refund. Refunded orders that are not cancelled yet are shown too. All orders can be shown with a filter.
Why: Cancelled and expired orders are never deleted, so the list grows over time. A cancelled order that is still paid also needs the admin, until the refund is done.

**What does the order search in the CMS look in?**
Decision (Should): The order number, also a part of it, the customer's name and email, and the titles of the order's rows. Every word must be in one of them, in upper or lower case: "anna kruka" finds Anna's order with a pot. The search stays within the chosen tab ("Att göra" or "Alla beställningar"), and the tabs keep it. When nothing is found under "Att göra", a link searches every order.
Why: A customer who writes about an order gives their name, email or order number, or only remembers what they bought. Searching within the tab works like the shop's category tabs, and the link covers an order that is already shipped.

**Can the admin cancel an order that is not paid yet?**
Decision: No. The admin can only cancel a paid order that is not shipped (or a refunded one, see below). An unpaid order is cancelled automatically when its payment expires.
Why: While the payment is pending, the customer can still pay in Stripe Checkout. If the admin could cancel the order, the customer could pay for an order that will never be shipped. This way, every cancel in the CMS puts the products back in stock.

**Does cancelling an order refund the customer?**
Decision: Not automatically. The admin refunds in the Stripe dashboard, Stripe notifies the API, and the payment becomes `Refunded`. Cancelling an order that has not been shipped increases the stock again; the refund itself never changes the stock.
Why: Automatic refunds are more code and more risk, and refunds are rare in a small shop.

**What if the admin refunds in Stripe before cancelling the order?**
Decision: The payment becomes `Refunded` and the order stays `Pending`. It can no longer be shipped, but the admin can cancel it, which puts the products back in stock. Until then the default list shows it as "needs cancelling".
Why: Only the admin changes the order status (constraints.md). A refunded order can also be one that was shipped and returned, which must stay `Shipped`, so the refund itself never cancels the order.

**Which order is flagged when the last item is sold twice?**
Decision: The one that was paid last, i.e. the one whose payment took the stock below 0. The CMS shows it as "Dubbelsåld" until the admin ships, cancels or refunds it. It can still be shipped.
Why: The customer who paid first should get the item. Two webhooks at the same time cannot both be saved (the concurrency token on the stock), so the one that is handled again is always the one that finds the stock at 0. The admin of a shop with handmade items may be able to make one more, so the flag is a warning and does not block shipping.

## Shipping, money and countries

**How are orders shipped?**
Decision: The admin packs and sends the order manually (e.g. at a postal agent) and then marks it as `Shipped` in the CMS. There is no integration with a shipping company.

**Is there a shipping cost?**
Decision: Not in the MVP, where the shipping cost is included in the product price. As a Should, it is calculated from the products' packed weight and size, the way PostNord and DHL price parcels: the chargeable weight is the higher of the total weight and the volume weight (the total volume × 280 kg/m³). Up to 1 kg costs 59 kr, up to 3 kg 79 kr, up to 10 kg 129 kr and up to 20 kg 199 kr. Above 20 kg it costs 199 kr per started 20 kg. There is one method, "Paket till ombud". The cost is shown in the cart and as its own row in Stripe Checkout, and the order stores the method and the cost.
Why: Art is often large and light, so one fixed price would be far too low for a big painting and too high for a ring. This replaced the fixed price on Mon 9 Nov, at the cost of about a day of the last sprint. Storing shipping on the order means more shipping methods or prices per country can be added later without changing old orders.

**Which weight and size does the admin enter?**
Decision: The packed parcel's, in grams and centimetres, since that is what a shipping company weighs and measures. They are not shown in the shop.

**How does the shop show the item's own size?**
Decision: In fields of their own, apart from the parcel: length, width, height, diameter and weight, all optional (added 11 Nov). Only the filled-in ones are shown, e.g. "Ø 8 × H 9 cm" for a cup and "B 30 × H 40 cm" for a painting.
Why: The parcel includes the packaging, so it would show the wrong size. With optional fields the admin decides what is relevant for each product, e.g. a diameter or no weight, without a setting per category.

**How is the parcel worked out when an order has several products?**
Decision: The weights and the volumes are added together, as if everything is packed in one box.
Why: It is simple and needs no packing logic. The known limitations are in architecture.md.

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
