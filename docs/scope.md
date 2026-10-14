# Scope – GREJ

What is built, and what is not. Rules live in [constraints.md](constraints.md), interpretations of unclear requirements in [ambiguity.md](ambiguity.md).

## Goal

GREJ is a webshop for art and handmade items. Customers buy products with Stripe, and an admin manages products, categories and orders in a built-in CMS.

The MVP is a single-seller webshop with an admin CMS = all **Must** items below.

**Tech stack:** Angular (Vercel) · ASP.NET Core Web API (Render) · PostgreSQL · Stripe.

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
- Admin login with role-based access
- Admin CMS: create, edit and delete products, with one image per product
- Admin CMS: manage categories and product properties (material, color)
- Admin CMS: view orders and update their order status (not payment status)
- Deployed: frontend on Vercel, backend on Render

### Should

- Filter products by category
- Search products by name
- Filter products by price, material and color
- Stock count that decreases when a product is purchased; sold-out products cannot be bought
- Responsive design: usable on mobile, tablet and desktop
- Accessibility: keyboard navigation, alt texts on images, sufficient contrast
- Several images per product
- Subcategories, one level (e.g. Ceramics → Plates, Cups, Bowls)
- Shipping cost: one fixed price, shown as its own row in Stripe Checkout

### Could

- Order confirmation by email
- Dark and light mode

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
