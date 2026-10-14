# Constraints – GREJ

The rules the system must follow, regardless of how it is built. What is built is described in [scope.md](scope.md).

## Permissions

| Action | Visitor | Admin | Seller (future) |
|---|---|---|---|
| Browse products and categories | Yes | Yes | Yes |
| Add to cart and pay | Yes | Yes | Yes |
| Create, edit, delete products | No | All products | Only their own |
| Manage categories and product properties | No | Yes | No |
| View orders and update order status | No | All orders | Only orders with their products |
| Approve and block seller accounts | No | Yes | No |

- Customers buy as guests; no login is required to buy.
- Every admin endpoint in the API checks the role. Hiding something in the UI is never the only protection.
- There is only one admin account, created by a seed script. Its password comes from a secret, not from the code.

## Orders and payments

An order has two separate statuses: a **payment status** (is it paid?) and an **order status** (where is it in handling?). The payment provider only changes the payment status, and the admin changes the order status. The only automatic change to the order status is that the order is cancelled when its payment expires.

A payment is stored separately from the order, with its provider (e.g. Stripe) and the provider's reference. This way more payment methods can be added later without changing the order flow.

### Payment status

| Status | Meaning | Set by |
|---|---|---|
| `Pending` | Customer has been sent to the payment provider, not paid yet | API, when the Checkout session is created |
| `Paid` | The provider has confirmed the payment | Webhook (`checkout.session.completed`) |
| `Expired` | The customer never paid and the Checkout session expired | Webhook (`checkout.session.expired`) |
| `Refunded` | The money has been returned to the customer | Webhook (`charge.refunded`) |

```
Pending ──► Paid ──► Refunded
   │
   ▼
Expired
```

- `Failed` is added when a payment method that can fail after the customer has left checkout is added. With Stripe Checkout and cards, a declined card does not end the session; the customer tries again or the session expires.

### Order status

| Status | Meaning | Set by |
|---|---|---|
| `Pending` | Order created, not yet handled | API, when the order is created |
| `Shipped` | Admin has sent the order | Admin |
| `Cancelled` | The order will not be shipped | Admin, or automatically when the payment expires |

```
Pending ──► Shipped
   │
   ▼
Cancelled
```

### Rules

- No other transitions than the ones above are allowed.
- An order can only be set to `Shipped` if its payment is `Paid`.
- When the payment becomes `Expired`, the order becomes `Cancelled`.
- An order that is `Cancelled` with payment `Paid` is shown to the admin as "needs refund".
- If the last item was already sold when the payment becomes `Paid`, the order is flagged for the admin, who cancels it and refunds it in Stripe (Should).
- An order is never deleted.
- Each order row stores the product's title and price at the time of purchase. Later changes to a product never change old orders.
- The customer's name, email and address (including country) are taken from Stripe Checkout and stored on the order. Only Swedish addresses are allowed in this version.
- If shipping cost is built, the order stores the shipping method, cost and currency.

## Prices and money

- Prices are never stored as floating point.
- Every price, order and payment stores its currency. In this version it is always SEK.
- The price the customer pays is always calculated by the API from the database. Prices from the browser (cart, localStorage) are never trusted.

## Products and categories

- A product belongs to exactly one category.
- A product that is part of an order cannot be hard deleted. It is hidden instead (`IsActive = false`).
- Categories have at most one level of subcategories (Should).
- A category that has products or subcategories cannot be deleted.
- Every product has an owner (`SellerId`), which is always the admin in this version. This keeps the door open for a marketplace.
- A product must have a title, a category and a price greater than 0. This is validated in both the form and the API.
- A product has one image in the MVP, and at most 10 when several images are built (Should).

## Stock

- Stock decreases only when a payment becomes `Paid`, not when a product is added to the cart.
- If two customers buy the last item at the same time, the stock goes below 0. This shows the admin that one of the orders must be cancelled and refunded.
- When the admin cancels a paid order that has not been shipped, the stock is increased again automatically. A refund never changes the stock.
- When a shipped order is returned, the admin adjusts the stock manually in the CMS.
- A product with stock 0 or less is shown as sold out and cannot be added to the cart.
- The API checks stock again before creating a Checkout session.

## Stripe

- Stripe runs in test mode only.
- The database is updated from the Stripe webhook, never from the success page in the browser. If Stripe and the database disagree, Stripe wins.
- The webhook verifies Stripe's signature before trusting the request.
- The same webhook event may arrive more than once. Handling it twice must not change anything twice.

## Security

- Secrets (Stripe keys, Supabase keys, database connection, admin password) are stored in User Secrets locally and environment variables in hosting, never in the code or the repo.
- Passwords are hashed, never stored in plain text.
- The API only accepts requests from the frontend's own domain (CORS).
- Uploaded files must be images (jpg, png, webp) and at most 5 MB.

## Performance and scale

- Built for a small shop: up to a few hundred products and a handful of simultaneous users.
- Every list endpoint is paginated; no endpoint returns all rows of a table.
- Images are not resized automatically in this version, since Supabase's free tier has no image resizing. The admin uploads images at a reasonable size.

## Failure modes

| What happens | Expected behaviour |
|---|---|
| Customer cancels or closes Stripe Checkout | Cart is kept, customer can try again. The payment expires later and the order is cancelled |
| Customer's card is declined | Customer stays in Stripe Checkout and can try another card |
| Customer reaches the success page before the webhook has arrived | Page says the order is being confirmed, not that it is paid |
| Webhook never arrives | Payment stays `Pending`; admin can see pending orders |
| Product sold out while in cart | Customer is told before checkout, product is removed from cart |
| Product price changed while in cart | Customer pays the current price from the database and sees it before paying |
| Admin enters invalid data | Clear error message; nothing is saved |
| API is down | Frontend shows an error message instead of a blank page |
