# Scope – GREJ

What is built, and what is not. Rules live in [constraints.md](constraints.md), interpretations of unclear requirements in [ambiguity.md](ambiguity.md).

## Goal

GREJ is a webshop for art and handmade items. Customers buy products with Stripe, and an admin manages products, categories and orders in a built-in CMS.

The MVP is a single-seller webshop with an admin CMS = all **Must** items below.

**Tech stack:** Angular (Vercel) · ASP.NET Core Web API (Render) · PostgreSQL and image storage (Supabase) · Stripe.

**Language:** the shop is in Swedish. The documentation is in English.

## Users

| User | What they do |
|---|---|
| Visitor / customer | Browses products, adds them to the cart, pays with Stripe |
| Admin | Logs in, manages products, categories and product properties, views and updates orders |

## MoSCoW

### Must (MVP)

- Product list and product page
- Shopping cart: add and remove products, multiple products per order
- Buy products with Stripe Checkout in test mode
- Order saved in the database, and its payment marked as paid via Stripe webhook
- Stock count that decreases when a product is paid for; sold-out products are shown as sold and cannot be bought
- Admin login with role-based access
- Admin CMS: create, edit and delete products, with one image per product
- Admin CMS: manage categories and product properties (material, color)
- Admin CMS: view orders and update their order status (not payment status)
- Deployed: frontend on Vercel, backend on Render

### Should

- Filter products by category
- Search products by name
- Filter products by price, material and color
- Styled customer pages with shared colors, typography and spacing
- Own visual design of the main customer pages, made before they are styled (about one day, decided Fri 23 Oct). Plan B: a component library with own colors. The own design was chosen on 4 Nov; from 8 Nov the code itself is the design (design.md)
- Responsive design: usable on mobile, tablet and desktop
- Accessibility: keyboard navigation, alt texts on images, sufficient contrast
- Several images per product
- Subcategories, one level (e.g. Ceramics → Plates, Cups, Bowls)
- Shipping cost from the products' packed weight and size, with one method ("Paket till ombud"), shown in the cart and as its own row in Stripe Checkout. Changed on 9 Nov from one fixed price (ambiguity.md)
- Flag an order when the last item was sold twice at the same time
- A link from an order in the CMS to its payment in Stripe, and the order number on the payment in Stripe (added 10 Nov)
- Search orders in the CMS by order number, customer and product (added 10 Nov)
- Sort the product list by newest or price (added 10 Nov)
- The item's own size and weight on the product page, optional for each product (added 11 Nov)
- Search and filter the products in the CMS, and search its materials and colors; the product counts on the category, material and color pages link to the filtered list (added 12 Nov)
- At most 10 logins and 10 checkouts per minute from one IP address (added 12 Nov)
- The order on the success page: its rows, shipping and total, and its delivery and payment once paid (added 12 Nov)
- An about page, "Om GREJ", linked from the header, the phone menu and the footer (added 12 Nov)
- A terms page, "Villkor", that only says what the shop does (ordering and payment, shipping, the right of withdrawal, personal data and browser storage), with contents that follow the scrolling; linked from the footer and the product page. It is information about the demo shop, not reviewed terms (added 12 Nov)

### Could

- Order confirmation by email (built 12 Nov; sent from a verified domain, ambiguity.md)
- Dark and light mode (built 12 Nov; follows the system, with a button that saves the choice)

### Won't (this version)

- Real payments (Stripe test mode only)
- Ratings and reviews
- Customer accounts and order history (customers buy as guests)
- Automatic refunds (admin refunds manually in Stripe)
- Partial refunds
- Integration with shipping companies (tracking, labels)
- Multiple shipping methods
- Multiple currencies
- Multiple languages
- Selling to countries other than Sweden
- Payment methods other than Stripe Checkout
- VAT and legal requirements for distance selling

## Known limitations

Each area's known limitations are listed where it is described in [architecture.md](architecture.md) (shipping, email, rate limiting, payments, CMS, filters). Improvements that were left out are collected in the report.

## Future ideas (not planned)

A small marketplace where artists create accounts and sell their own work: seller accounts and profiles, seller pages, admin approves and blocks sellers, payouts to sellers, chat between buyers and sellers. Open questions are listed in [ambiguity.md](ambiguity.md).

## Built to be extended

The following are not built now, but the MVP must not block them:

- A marketplace with several sellers
- More products and users than a small shop
- More currencies, countries, languages, shipping methods and payment methods

**Rule of thumb:** prepare only when it is cheap now and expensive to change later – which almost always means data that is stored (currency, country, price at purchase, payment provider, shipping cost). Everything else is built simply and changed when it is needed. How this is achieved is described in the architecture and constraints, not here.

## First vertical slice

> A visitor opens one product page with a product from the database, pays with Stripe in test mode, and the order is saved in the database with payment status `Paid`.

**Explicitly out of this slice:** cart, admin, login, search, images, styling.

**Done when:** one product can be bought in Stripe test mode, and a database row proves it – without faking any step by hand.
