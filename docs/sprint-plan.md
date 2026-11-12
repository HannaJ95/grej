# Sprint plan – GREJ

**Project period:** Mon 12 October – Fri 20 November 2026 (presentations on 19–20 November).

Sprints run Monday–Friday. Weekends are slack for anything that did not fit, not planned work. All Must items are planned to be done by **Wed 4 November**, and no new features are started after **Thu 12 November**. Everything (the code, the documents, the repo and deploy links and the Result section in examensarbete.md) is submitted by **Sun 15 November**, and the code is not changed after that.

Changed on 8 Nov: the deadline for the code moved from after the buffer week to Sun 15 Nov, so the buffer week was removed, sprint 4 was shortened by one day and its items were put in priority order.

A few lines about how AI was used are written in [ai-log.md](ai-log.md) every day. They become the AI documentation in the Result section.

What each item means is described in [scope.md](scope.md). When something is done is described in [definition-of-done.md](definition-of-done.md).

## Overview

| Sprint | Dates | Goal | MoSCoW |
|---|---|---|---|
| 0 – Setup | Mon 12 – Fri 16 Oct | An empty app deployed end to end | – |
| 1 – Buying | Mon 19 – Fri 23 Oct | A customer can buy several products | Must |
| 2 – Admin and catalog | Mon 26 – Fri 30 Oct | The admin can manage products and the catalog | Must |
| 3 – Orders, MVP | Mon 2 – Fri 6 Nov | The admin can handle orders; MVP complete Wed 4 Nov | Must + Should |
| 4 – Should | Mon 9 – Thu 12 Nov | Customers can filter and search; every admin page is styled | Should |
| Wrap-up | Fri 13 – Sun 15 Nov | Stable, documented project; everything submitted | – |
| Presentation | Mon 16 – Fri 20 Nov | Presentation ready and held on 19–20 Nov; no code changes | – |

## Sprint 0 – Setup (Mon 12 – Fri 16 Oct)

**Goal:** an empty app deployed end to end: Angular on Vercel calls the API on Render, which reads from the database.

- [x] Finish the planning documents and submit the detailed plan
- [x] Repo, branch strategy and solution structure (see [architecture.md](architecture.md))
- [x] ASP.NET Core API with EF Core, PostgreSQL and a first migration
- [x] Angular project
- [x] Supabase project for the database and image storage, connected through the session pooler
- [x] CI (GitHub Actions): build and run tests on every pull request
- [x] Deploy frontend to Vercel and API to Render (Docker), with environment variables and CORS
- [x] Stripe test account and Stripe CLI installed
- [x] CLAUDE.md and hook that stops Claude Code from reading secrets

## Sprint 1 – Buying (Mon 19 – Fri 23 Oct)

**Goal:** a customer can buy several products with Stripe in the deployed environment.

First vertical slice (Mon–Wed):

- [x] Product page reading one product from the database (seeded)
- [x] Create order and payment, and redirect to Stripe Checkout
- [x] Webhook: verify signature, mark the payment as `Paid`
- [x] Works in the deployed environment, proven by a database row

Cart and checkout (Wed–Fri):

- [x] Product list (paginated)
- [x] Cart in localStorage: add, remove, change quantity
- [x] Checkout with several products; prices always taken from the database
- [x] Stock: checked before checkout, decreased on `Paid`; sold-out products cannot be bought
- [x] Customer details and Swedish address from Stripe stored on the order
- [x] Success page with order number ("your order is being confirmed")
- [x] Webhook: expired sessions (`Expired` / `Cancelled`) and the same event handled twice

## Sprint 2 – Admin and catalog (Mon 26 – Fri 30 Oct)

**Goal:** the admin can log in and manage products, categories and properties.

- [x] Admin user created by a seed script; login with JWT and the Admin role
- [x] Admin endpoints protected by role; route guard in Angular
- [x] CMS: create, edit, delete (or hide) products, with validation in form and API
- [x] Image upload to Supabase Storage (one image per product)
- [x] CMS: categories (no deleting categories with products)
- [x] CMS: materials and colors, and choosing several per product
- [x] Component library and shared style variables (colors, typography, spacing)

## Sprint 3 – Orders and MVP (Mon 2 – Fri 6 Nov)

**Goal:** the admin can handle orders. **All Must items are done Wed 4 Nov.**

Must (Mon–Wed):

- [x] Demo data: a command that empties the database and fills it with demo categories, products and images
- [x] CMS: order list (default: paid, not shipped) and order details
- [x] Admin sets order status `Shipped` / `Cancelled` with the rules from constraints; cancelling a paid order restores the stock
- [x] Webhook: `charge.refunded` marks the payment as `Refunded`
- [x] Full flow tested in production: buy → paid → shipped

Should (Wed–Fri):

- [x] Own visual design of the main customer pages, or plan B (about one day; moved from sprint 2, decided by Wed 4 Nov)
- [x] Style the customer pages with the shared variables (own design or plan B)
- [x] Filter products by category
- [x] Subcategories (one level) in the CMS and as filters
- [x] Admin layout (menu) and the category pages after the new admin design in Figma (added 6 Nov, so subcategories could follow the design's flow; the other admin pages are styled later)

## Sprint 4 – Should (Mon 9 – Thu 12 Nov)

**Goal:** customers can filter and search the products, and every admin page has the shop's look. **No new features after Thu 12 Nov.**

In priority order. Responsive design and accessibility are checked on every page that changes.

- [x] Filter by price, material and color, including the filter panel on phones and tablets
- [x] Style the remaining admin pages: products, orders, the start page and the login page
- [x] Search products by name
- [x] Shipping cost from the products' packed weight and size, in the cart and in Stripe Checkout, stored on the order (changed on 9 Nov from one fixed price)
- [x] Several images per product
- [x] Flag double sale of the last item: the order is shown as "Dubbelsåld" in the CMS (dropped on 8 Nov, built on 10 Nov after the other items)
- [x] Link from the order page to the payment in Stripe, and the order number on the payment in Stripe (added 10 Nov)
- [x] Search orders in the CMS by order number, customer and product, with the number of hits (added 10 Nov)
- [x] Sort the product list by newest or price, from the toolbar (added 10 Nov)
- [x] Polish: categories in the footer, a bag icon on the cart button, and "Frakt och retur" on the product page (added 11 Nov)
- [x] Search and filters in the CMS: products (category, material, color, visibility, sort, date added), materials and colors, with linked product counts (added 12 Nov)
- [x] Rate limiting on login and checkout: 10 attempts per minute per IP address, with a message on the page (added 12 Nov)
- [x] Order confirmation by email, and the order with its delivery and payment on the success page (added 12 Nov)
- [x] Dark and light mode: follows the system, with a button in the header and the menus that saves the choice (added 12 Nov)


## Wrap-up (Fri 13 – Sun 15 Nov)

**Goal:** a stable, documented project, submitted by Sun 15 Nov. The code is not changed after that.

- [ ] Fix bugs, no new features
- [ ] Responsive design and accessibility review of all pages
- [ ] README: how to run the project locally
- [ ] Update the planning documents to match what was built, including known limitations
- [ ] Demo content: final texts and images in the demo data, reset once in the deployed shop
- [ ] Write the Result section in examensarbete.md (AI documentation and personal evaluation) and submit it with the repo and deploy links

## Presentation (Mon 16 – Fri 20 Nov)

- [ ] Prepare and rehearse the presentation (15–20 minutes), including a demo in the deployed environment (with a backup recording)

## Checkpoints

| Date | Check | If not reached |
|---|---|---|
| Fri 16 Oct | The empty app is deployed end to end | Continue Monday; the vertical slice may slip into Thursday |
| Wed 21 Oct | Supervision 1: the first vertical slice works in production | Bring what is blocking to the supervision; Stripe and webhook have priority over the cart |
| Fri 23 Oct | Several products can be bought in production; decide on own visual design | Cart polish moves to sprint 2; Stripe and webhook have priority; plan B is used instead of an own design |
| Fri 30 Oct | The admin can log in and manage products, categories and properties | Remaining CMS parts move to the start of sprint 3; the Should items in sprint 3 are dropped |
| Wed 4 Nov | Supervision 2: all Must items done | Sprint 3 and 4 finish the Must items; Should is limited to styling the customer pages and the category filter |
| Thu 12 Nov | Feature freeze | Unfinished features are removed or hidden, not finished during the wrap-up |
| Sun 15 Nov | Everything submitted: code, documents, links and the Result section | Submitted regardless; what is not done is written down as a known limitation |

## Cut order for Should

If time runs short, Should items are dropped from the bottom of this list first. Styling the customer pages, filter by category and subcategories are done.

1. Responsive design and accessibility
2. Filter by price, material and color
3. Styling the remaining admin pages
4. Search by name
5. Shipping cost by weight and size
6. Several images per product

Flag double sale was dropped on 8 Nov and built on 10 Nov, after the other items (see sprint 4).

The own visual design is not in this list. It was not decided at the checkpoint Fri 23 Oct, so it is decided by Wed 4 Nov, with the component library and own colors from sprint 2 as plan B.
