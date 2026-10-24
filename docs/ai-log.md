# AI log – GREJ

A few lines a day about how AI was used: what for, which tool, and what worked or did not. This becomes the "Documentation of AI use" in the Result section of examensarbete.md.

## 2026-10-14

- **Planning:** Claude Code reviewed the planning documents for gaps and contradictions between the files. The findings were useful, but the feedback was long and overwhelming, so we changed to shorter steps with one decision at a time.
- **Research:** Claude checked the free tiers of Render, Supabase and Stripe. This led to choosing Supabase for both the database and the images, since Render's free database expires after 30 days.
- **Workflow:** I commit before letting Claude change files, so I can review and undo its changes in the diff.

## 2026-10-15

**Sprint 0:**

- **Database:** Claude Code set up EF Core with Supabase step by step, explaining each command. The secrets hook blocked Claude twice when commands only mentioned secret file names, which showed that the protection works. I set the connection string in User Secrets myself, so Claude never saw the password.

-  Claude Code set up Angular, CI with GitHub Actions, a Dockerfile, and deploys to Render and Vercel, one step at a time in plan mode. Claude checked new APIs (Angular 22's @Service, deprecated withFetch) in the installed packages instead of guessing. I set all secrets in Render and User Secrets myself.

**Sprint 0 done**

## 2026-10-16

- **Learning:** Since we were ahead of schedule, Claude Code ran short lessons on .NET (SDK, NuGet, solution and layers, middleware and DI) with comparisons to JavaScript and Laravel, and quiz questions. Answering "I don't know" showed what to go over again.
- **Verification:** Claude checked the Stripe CLI login with a harmless read command instead of reading the config file. It also found that an older .NET SDK 9 on PATH cannot build our `.slnx` solution.

## 2026-10-19

- **Learning:** Instead of more lessons up front, we tried "guided mode": I run every command and write all code myself, and Claude Code explains each step (why, what a command or package does, whether a file will grow later). Lessons on EF Core, Angular and deployment were woven into the steps where they were needed.
- **Verification:** When preparing the seed, Claude found that EF Core's `HasData` sets the product id by hand. PostgreSQL's id counter would then not move, and the first product created in the CMS would crash. We changed to `UseSeeding` before writing the code.

## 2026-10-20

- **Building:** Finished sprint 1 item 1 in guided mode: Product entity, migration and seed, `GET /api/products/{id}`, integration tests with a fake repository, the Angular product page and the deploy.
- **Code control:** Claude read my files after each part before giving the next one. It found a file I had not saved and an indentation slip. It also checked with a real request that Vercel handles deep links, instead of guessing.

## 2026-10-21

- **Building:** Finished sprint 1 item 2 in guided mode: Order, OrderItem and Payment in the domain, a migration, `CheckoutService` behind `IPaymentProvider`, Stripe Checkout with Stripe.net, `POST /api/checkout`, integration tests with fakes, a buy button and a placeholder success page.
- **Design:** Claude suggested building the order in memory and saving it with its payment only after Stripe has created the session, so a Stripe failure never leaves an order that can never be paid. I asked whether this affects security or price changes. It does not, since the price is read from the database once per checkout. We updated the diagram in architecture.md.
- **What did not work:** Early in the session Claude made small slips: a JSON typo, a step moved between parts, a folder renamed from the plan, and wording that made me think it had committed. After that Claude compiled and ran each code block in a copy outside the repo before giving it to me, and the later parts had no errors.

## 2026-10-22

- **Building:** Finished sprint 1 items 3 and 4 in guided mode: `Payment.MarkAsPaid()`, a webhook use case behind `IPaymentWebhookReader`, Stripe's signature check with Stripe.net, `POST /api/webhooks/stripe`, integration tests that sign their own webhooks, and a webhook endpoint in Stripe for production. A test purchase in production was marked `Paid` by the webhook.
- **Verification:** Before the plan, Claude built and tested all code in a copy outside the repo. This showed that registering the service before its dependencies would crash the app (ValidateOnBuild), so the registration was moved to the Infrastructure part. Every part compiled on the first try.
- **What did not work:** At first no events reached `stripe listen`. With read-only Stripe CLI calls, Claude found that the CLI was logged in to a different sandbox than the API's key. Next, `stripe listen` had been started without `--forward-to`. When the payment still looked `Pending`, Claude ran the real Stripe event through the webhook reader to rule out the code. I had looked at the wrong row.

## 2026-10-23

- **Building:** Finished sprint 1 item 5 in guided mode: `GET /api/products` with pagination (`PagedResult<T>`, `ProductListQuery` with DataAnnotations), the Angular product list with the page number in the URL (`?sida=2`), and tests for the endpoint, the EF Core query (with EF Core's in-memory provider) and the paging links (with `RouterTestingHarness`).
- **Learning:** I asked whether fetching one page at a time makes the shop slow, where validation messages such as "The field PageSize must be between 1 and 48." come from (built into .NET's `[Range]` and `[ApiController]`), and whether `interface` or `type` is preferred in TypeScript.
- **Verification:** Claude built everything in a copy outside the repo before the plan, printed the SQL that EF Core sends to PostgreSQL, and checked that the tests fail when the filter on hidden products or the `?sida=` binding is broken.

- **Building:** Finished sprint 1 item 6 in guided mode: a `CartService` with signals saved to localStorage (with unit tests), "Lägg i varukorgen" on the product page, a cart panel built on the native `<dialog>` element, and checkout from the cart with several products. The API already accepted several products, so the server did not change.
- **Design:** I asked for a cart panel from the navigation instead of a separate cart page, which is common in webshops. Claude explained that a `<dialog>` gives Escape, focus handling and a backdrop for free, and that Stripe's payment page already shows the products, so no own checkout page is needed. Limiting quantity by stock waits for item 8, since the API does not send the stock yet.
- **Learning:** I thought orders were only saved when they were paid. Claude showed that the order is saved as `Pending` when Stripe creates the session, because the order number, the prices and the webhook need it, and that expired sessions will be marked `Expired` / `Cancelled` in the last item of the sprint.

## 2026-10-24

- **Building:** Finished sprint 1 item 7 in guided mode: integration tests for checkout with several products (including a request with its own prices, which the API ignores), request rules in `CheckoutRequest` with `IValidatableObject` (at most 100 rows, no empty rows, each product once), and one SQL query for all products in the cart (`WHERE "Id" = ANY (@ids)`) instead of one per row. Verified in production with order GREJ-ED5F56C7 (two products, `Paid`).
- **Verification:** Before the plan, Claude ran the code in a copy outside the repo and found that the same product twice gave 200 OK with two order rows, which could get around the stock check in item 8, and that `{"items":[null]}` gave 500. Those tests were written first and failed before the fix. Claude also checked that a test fails if the filter on hidden products is removed, and compared my files with the tested copy before I committed.
- **Learning:** Claude explained that the item made an existing flow proven, safer and faster rather than adding something visible, and that a refactoring with tests that stay green should look the same.
