# Sprint plan – GREJ

**Project period:** Mon 12 October – Fri 20 November 2026 (presentations on 19–20 November).

Sprints run Monday–Friday. Weekends are slack for anything that did not fit, not planned work. All Must items are planned to be done by **Wed 4 November**, no new features are started after **Fri 13 November**, the repo and deploy links and the Result section are submitted in examensarbete.md before **Mon 16 November**, and the last days are buffer for bugs, illness and the presentation.

A few lines about how AI was used are written in [ai-log.md](ai-log.md) every day. They become the AI documentation in the Result section.

What each item means is described in [scope.md](scope.md). When something is done is described in [definition-of-done.md](definition-of-done.md).

## Overview

| Sprint | Dates | Goal | MoSCoW |
|---|---|---|---|
| 0 – Setup | Mon 12 – Fri 16 Oct | An empty app deployed end to end | – |
| 1 – Buying | Mon 19 – Fri 23 Oct | A customer can buy several products | Must |
| 2 – Admin and catalog | Mon 26 – Fri 30 Oct | The admin can manage products and the catalog | Must |
| 3 – Orders, MVP | Mon 2 – Fri 6 Nov | The admin can handle orders; MVP complete Wed 4 Nov | Must + Should |
| 4 – Should | Mon 9 – Fri 13 Nov | Customers can find products; shipping cost; Result submitted | Should |
| Buffer | Mon 16 – Wed 18 Nov | Stable, documented project and presentation ready | – |
| Presentation | Thu 19 – Fri 20 Nov | | |

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
- [ ] Webhook: expired sessions (`Expired` / `Cancelled`) and the same event handled twice

## Sprint 2 – Admin and catalog (Mon 26 – Fri 30 Oct)

**Goal:** the admin can log in and manage products, categories and properties.

- [ ] Admin user created by a seed script; login with JWT and the Admin role
- [ ] Admin endpoints protected by role; route guard in Angular
- [ ] CMS: create, edit, delete (or hide) products, with validation in form and API
- [ ] Image upload to Supabase Storage (one image per product)
- [ ] CMS: categories (no deleting categories with products)
- [ ] CMS: materials and colors, and choosing several per product
- [ ] Component library and shared style variables (colors, typography, spacing)
- [ ] Own visual design of the main customer pages, if chosen at the checkpoint Fri 23 Oct (Should, about one day)

## Sprint 3 – Orders and MVP (Mon 2 – Fri 6 Nov)

**Goal:** the admin can handle orders. **All Must items are done Wed 4 Nov.**

Must (Mon–Wed):

- [ ] CMS: order list (default: paid, not shipped) and order details
- [ ] Admin sets order status `Shipped` / `Cancelled` with the rules from constraints; cancelling a paid order restores the stock
- [ ] Webhook: `charge.refunded` marks the payment as `Refunded`
- [ ] Full flow tested in production: buy → paid → shipped

Should (Wed–Fri):

- [ ] Style the customer pages with the shared variables (own design or plan B)
- [ ] Filter products by category
- [ ] Subcategories (one level) in the CMS and as filters

## Sprint 4 – Should (Mon 9 – Fri 13 Nov)

**Goal:** customers can find products easily, the shop has a shipping cost, and the Result section is submitted. **No new features after Fri 13 Nov.**

- [ ] Write the Result section in examensarbete.md (AI documentation and personal evaluation) and submit the repo and deploy links, before Mon 16 Nov
- [ ] Responsive design and accessibility review of all pages
- [ ] Fixed shipping cost in Stripe Checkout, stored on the order
- [ ] Search products by name
- [ ] Several images per product
- [ ] Filter by price, material and color
- [ ] Flag double sale of the last item
- [ ] Could, only if everything above is done: order confirmation email, dark and light mode

## Buffer (Mon 16 – Wed 18 Nov)

**Goal:** a stable, documented project and a presentation that is ready.

- [ ] Fix bugs, no new features
- [ ] README: how to run the project locally
- [ ] Update the planning documents to match what was built, including known limitations
- [ ] Demo content: real products with images and texts in the deployed shop
- [ ] Prepare and rehearse the presentation (15–20 minutes), including a demo in the deployed environment (with a backup recording)

## Checkpoints

| Date | Check | If not reached |
|---|---|---|
| Fri 16 Oct | The empty app is deployed end to end | Continue Monday; the vertical slice may slip into Thursday |
| Wed 21 Oct | Supervision 1: the first vertical slice works in production | Bring what is blocking to the supervision; Stripe and webhook have priority over the cart |
| Fri 23 Oct | Several products can be bought in production; decide on own visual design | Cart polish moves to sprint 2; Stripe and webhook have priority; plan B is used instead of an own design |
| Fri 30 Oct | The admin can log in and manage products, categories and properties | Remaining CMS parts move to the start of sprint 3; the Should items in sprint 3 are dropped |
| Wed 4 Nov | Supervision 2: all Must items done | Sprint 3 and 4 finish the Must items; Should is limited to styling the customer pages and the category filter |
| Fri 13 Nov | Feature freeze; Result section and links submitted | Unfinished features are removed or hidden, not finished during the buffer. The Result is submitted before Mon 16 Nov regardless |

## Cut order for Should

If time runs short, Should items are dropped from the bottom of this list first:

1. Styling the customer pages
2. Filter by category
3. Subcategories
4. Responsive design
5. Accessibility
6. Fixed shipping cost
7. Search by name
8. Several images per product
9. Filter by price, material and color
10. Flag double sale – a negative stock already shows it

The own visual design is not in this list: it is decided at the checkpoint Fri 23 Oct, with a component library and own colors as plan B.
