# Sprint plan – GREJ

**Project period:** Mon 12 October – Thu 19 November 2026 (presentation 19 - 20 Nov).

Sprints run Monday–Friday. Weekends are slack for anything that did not fit, not planned work. All Must items are planned to be done by **Wed 4 November**, no new features are started after **Fri 13 November**, and the last days are buffer for bugs, illness and the presentation.

What each item means is described in [scope.md](scope.md). When something is done is described in [definition-of-done.md](definition-of-done.md).

## Overview

| Sprint | Dates | Goal | MoSCoW |
|---|---|---|---|
| 0 – Setup | Mon 12 – Fri 16 Oct | An empty app deployed end to end | – |
| 1 – Buying | Mon 19 – Fri 23 Oct | A customer can buy several products | Must |
| 2 – Admin and catalog | Mon 26 – Fri 30 Oct | The admin can manage products and the catalog | Must |
| 3 – Orders, MVP | Mon 2 – Fri 6 Nov | The admin can handle orders; MVP complete Wed 4 Nov | Must + Should |
| 4 – Should | Mon 9 – Fri 13 Nov | Customers can find products; shipping cost | Should |
| Buffer | Mon 16 – Wed 18 Nov | Stable, documented project and presentation ready | – |
| Presentation | Thu 19 Nov - Fri 20 Nov | | |

## Sprint 0 – Setup (Mon 12 – Fri 16 Oct)

**Goal:** an empty app deployed end to end: Angular on Vercel calls the API on Render, which reads from the database.

- [ ] Finish the planning documents and submit the detailed plan
- [ ] Repo, branch strategy and solution structure (see [architecture.md](architecture.md))
- [ ] ASP.NET Core API with EF Core, PostgreSQL and a first migration
- [ ] Angular project
- [ ] Choose database host and image service; check their free tier limits
- [ ] CI (GitHub Actions): build and run tests on every pull request
- [ ] Deploy frontend to Vercel and API to Render, with environment variables and CORS
- [ ] Stripe test account and Stripe CLI installed
- [ ] CLAUDE.md and hook that stops Claude Code from reading secrets

## Sprint 1 – Buying (Mon 19 – Fri 23 Oct)

**Goal:** a customer can buy several products with Stripe in the deployed environment.

First vertical slice (Mon–Wed):

- [ ] Product page reading one product from the database (seeded)
- [ ] Create order and payment, and redirect to Stripe Checkout
- [ ] Webhook: verify signature, mark the payment as `Paid`
- [ ] Works in the deployed environment, proven by a database row

Cart and checkout (Wed–Fri):

- [ ] Product list (paginated)
- [ ] Cart in localStorage: add, remove, change quantity
- [ ] Checkout with several products; prices always taken from the database
- [ ] Customer details and Swedish address from Stripe stored on the order
- [ ] Success page with order number ("your order is being confirmed")
- [ ] Webhook: expired sessions (`Expired` / `Cancelled`) and the same event handled twice

## Sprint 2 – Admin and catalog (Mon 26 – Fri 30 Oct)

**Goal:** the admin can log in and manage products, categories and properties.

- [ ] Admin user created by a seed script; login with JWT and the Admin role
- [ ] Admin endpoints protected by role; route guard in Angular
- [ ] CMS: create, edit, delete (or hide) products, with validation in form and API
- [ ] Image upload to the image service (one image per product)
- [ ] CMS: categories (no deleting categories with products)
- [ ] CMS: materials and colors, and choosing several per product

## Sprint 3 – Orders and MVP (Mon 2 – Fri 6 Nov)

**Goal:** the admin can handle orders. **All Must items are done Wed 4 Nov.**

Must (Mon–Wed):

- [ ] CMS: order list (default: paid, not shipped) and order details
- [ ] Admin sets order status `Shipped` / `Cancelled` with the rules from constraints
- [ ] Webhook: `charge.refunded` marks the payment as `Refunded`
- [ ] Full flow tested in production: buy → paid → shipped

Should (Wed–Fri):

- [ ] Stock count: sold out, decrease on `Paid`, increase on cancel, flag double sale
- [ ] Filter products by category
- [ ] Subcategories (one level) in the CMS and as filters

## Sprint 4 – Should (Mon 9 – Fri 13 Nov)

**Goal:** customers can find products easily, and the shop has a shipping cost. **No new features after Fri 13 Nov.**

- [ ] Responsive design and accessibility review of all pages
- [ ] Fixed shipping cost in Stripe Checkout, stored on the order
- [ ] Search products by name
- [ ] Several images per product
- [ ] Filter by price, material and color
- [ ] Could, only if everything above is done: order confirmation email, dark and light mode

## Buffer (Mon 16 – Wed 18 Nov)

**Goal:** a stable, documented project and a presentation that is ready.

- [ ] Fix bugs, no new features
- [ ] README: how to run the project locally
- [ ] Update the planning documents to match what was built, including known limitations
- [ ] Prepare and rehearse the presentation, including a demo in the deployed environment (with a backup recording)

## Checkpoints

| Date | Check | If not reached |
|---|---|---|
| Fri 16 Oct | The empty app is deployed end to end | Continue Monday; the vertical slice may slip into Thursday |
| Fri 23 Oct | Several products can be bought in production | Cart polish moves to sprint 2; Stripe and webhook have priority |
| Wed 4 Nov | All Must items done | Sprint 3 and 4 finish the Must items; Should is limited to stock count and category filter |
| Fri 13 Nov | Feature freeze | Unfinished features are removed or hidden, not finished during the buffer |

## Cut order for Should

If time runs short, Should items are dropped from the bottom of this list first:

1. Stock count – without it, unique art can be sold twice
2. Filter by category
3. Subcategories
4. Responsive design
5. Accessibility
6. Fixed shipping cost
7. Search by name
8. Several images per product
9. Filter by price, material and color
