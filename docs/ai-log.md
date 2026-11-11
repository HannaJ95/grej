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

- **Building:** Finished sprint 1 item 8 "Stock": the checkout compares quantity with stock and answers 409 with how many are left of each product, the webhook decreases the stock only the first time a payment becomes `Paid` (Payments → Orders → Catalog through application services, saved in one transaction), a concurrency token on `Stock` stops two webhooks at the same time from hiding a double sale, and the cart is limited by the stock and fixes itself after a 409. Verified locally and in production.
- **Way of working:** For this item I let Claude write the code instead of pasting it myself. I approved every change, Claude explained each part as before, and I still made all commits.
- **Verification:** Claude built everything in a copy outside the repo first. An existing test turned out to buy 2 of a product with stock 1, which the old checkout allowed. Claude removed `Include`, the concurrency token and the first-time check one at a time to show that a test fails without each, and checked with `has-pending-model-changes` that no migration was needed.
- **Learning:** EF Core's DbContext works as a unit of work: all repositories in a request share it, so one `SaveChangesAsync` saves the payment and the stock in one transaction. Optimistic concurrency adds the old stock to the UPDATE's `WHERE` instead of locking the row.

## 2026-10-26

- **Building:** Finished sprint 1 item 9: Stripe Checkout now asks for a shipping address and only allows Sweden, and the webhook stores the customer's name, email and address on the order. A `CustomerDetails` record is carried from the webhook reader through `PaymentUpdate` to `Order.SetCustomerDetails`, and saved in the same transaction as the payment and the stock. Verified locally and in production with Stripe test purchases.
- **Design:** The name is taken from the shipping address rather than the card, since that is who the package is sent to. The customer's text columns have no max length, because a value too long for its column would make the webhook fail and Stripe resend it for days; only `Country` is `varchar(2)`. There is no country check in the domain: Stripe already blocks other countries, and an exception in the webhook would stop a paid order from ever becoming `Paid`.
- **Verification:** Claude again wrote the code and I approved each change. Each part was compiled and tested in a copy outside the repo first, and Claude checked that the new webhook test fails without the line that stores the details.

- **Building:** Finished sprint 1 item 10: the success page shows the order number from Stripe's success URL, asks the customer to save it (no email is sent in this version), says the order is being confirmed and links back to the products. A Vitest test with `RouterTestingHarness` checks that the page shows the number, never says "paid", and empties the cart. Verified locally and in production.
- **Design:** I chose a page that always says "being confirmed" instead of a new API endpoint for the payment status, since sprint 1 is behind schedule. The template stays inline in the component, since the Angular guidelines prefer that for small components.
- **Learning:** I asked if the whole purchase flow could be tested automatically. Stripe's documentation says that Stripe Checkout blocks automated browser tests, so the flow is tested piece by piece (Vitest, integration tests with a fake Stripe and signed webhooks), and the step through Stripe is tested by hand in production. Playwright tests up to the redirect to Stripe are an idea for the report.

- **Building:** Finished sprint 1 item 11: the webhook now handles `checkout.session.expired`, which makes the payment `Expired` and the order `Cancelled` without touching the stock. Every handled event id is stored in a new table `ProcessedWebhookEvents` (the id is the primary key), saved in the same transaction as the payment, so an event that Stripe sends again is skipped. Verified locally with `stripe checkout sessions expire` and `stripe events resend`, and in production.
- **Design:** Claude explained that the table and the domain's "only the first time" check protect against different things: a resent event is skipped before anything is read, the same event in two requests at the same time can only be saved once (the second save fails and Stripe retries), and two different events for the same session only change the status once.
- **Verification:** Claude wrote the code and I approved each change, after each part had been compiled and tested in a copy outside the repo. One test proves that an already handled event is skipped even though the payment is still `Pending`, so it is the table that stops it and not the domain.

- **Building:** Finished sprint 2 item 1: ASP.NET Core Identity tables, a `seed-admin` command that creates the only admin account from User Secrets, `POST /api/auth/login` that returns a signed JWT with the `Admin` role (8 hours, lockout after 5 wrong passwords), and a login page in Angular built with Signal Forms. Verified locally and in production.
- **Design:** The seed is a command instead of running at startup, so it uses Identity's `UserManager` (hashing and password rules) and only runs when I ask. The API gives the same 401 for an unknown email, a wrong password and a locked account, so it never tells which accounts exist. Production has its own signing key.
- **Verification:** Claude wrote the code and I approved each change, after each part had been built and tested in a copy outside the repo. Removing the line that counts failed attempts made the lockout test fail. The Angular test needed an extra wait after the fake API answered, which showed up in the copy before I got the code.
- **Learning:** A JWT can be read by anyone, but not changed without the signing key.

## 2026-10-27

- **Building:** Finished sprint 2 item 2: the API checks the JWT with JwtBearer and `[Authorize(Roles = Roles.Admin)]`, starting with `GET /api/auth/me`. In Angular, an HTTP interceptor sends the token only to the API and logs the admin out on 401, and a route guard on `/admin` sends anyone who is not logged in to the login page. The admin page shows who is logged in. Verified locally and in production.
- **Design:** The guard only reads the token's expiry from localStorage and never calls the API, since hiding pages is a convenience and the API's role check is the real protection. `/admin` became a parent route with `canActivateChild`, so the CMS pages are protected when they are added as children. Without a signing key (as in CI) the API rejects every token instead of crashing.
- **Verification:** Claude wrote the code and I approved each change, after each part had been built and tested in a copy outside the repo, also without User Secrets as in CI. Integration tests show 401 without a token or with a token signed with another key, and 403 for a token without the Admin role. Removing `RoleClaimType = "role"` made the real admin get 403. An existing Angular test had a fixed expiry date that had already passed, which the new guard caught.
- **Learning:** 401 means "who are you?" and 403 means "I know who you are, but you are not allowed". In Angular tests, `whenStable()` waits for open HTTP requests, so a request that is never answered makes the test hang.

- **Building:** Finished sprint 2 item 3. Through `/api/admin/products`, protected by the Admin role, the CMS lists all products (hidden ones too, with the real stock) and can create, edit and delete them. In Angular there is a product table and one Signal Forms form for both new and existing products, with the same rules as the API. Verified locally and in production.
- **Design:** A product that is on an order is never deleted. The Catalog module asks the Orders module through `OrderService`, the API answers 409, and the page tells the admin to hide the product instead. When the admin saves, the form sends the stock it was opened with, so a sale made while the form was open is never overwritten. Category, owner and timestamps wait for item 5, so this item needed no migration.
- **Verification:** Claude wrote the code and I approved each change, after each part had been built and tested in copies outside the repo, including the in-between state with the list but without the form. Removing the price rule made exactly the three price tests fail, which proved that the update request inherits the rules.
- **Learning:** Signal Forms turns an empty number field into `null`, and `required` lets a title with only spaces through, so the form needed an extra `pattern` rule to match the API's `[Required]`.

## 2026-10-28

- **Building:** Finished sprint 2 item 4. In the CMS the admin uploads one image per product, with a required alt text. The API checks the file, stores it in a public Supabase Storage bucket and saves its URL in the new `ProductImages` table, and the shop's list and product page show it. Verified locally and in production.
- **Design:** The upload goes through the API instead of straight from the browser, so the Supabase secret key stays on the server, and it uses two plain HTTP calls instead of a Supabase package. The file type is read from the file's first bytes, not its name. The new file is uploaded before the row is saved and the old file is deleted last, so the database never points to a missing file. The table already has `SortOrder`, so several images (Should) need no new table. A new product now opens its own page after saving, since it needs an id before it can get an image.
- **Verification:** Claude wrote the code and I approved each change, after each part had been built and tested in copies outside the repo. The integration tests use a fake storage that records which files were uploaded and deleted, which proves that replacing an image or deleting a product removes the old file. The real upload was first tried with REST Client, then in the CMS locally and in production. The Angular build caught two test fixtures that lacked the new `image` field.
- **Learning:** Supabase's new secret keys are sent in the `apikey` header, not as a Bearer token. A file input cannot use `[formField]` in Signal Forms, so the file is set from the input's `(change)` event.

- **Building:** Finished sprint 2 item 5. The admin manages categories in the CMS through `/api/admin/categories` (a list, a form and delete), and every product must have one, chosen from a menu in the product form. The same migration added the product's owner (`SellerId`) and `CreatedAt`/`UpdatedAt`, and gave every existing product the category "Övrigt", the admin as owner and the time of the migration. Verified locally and in production.
- **Design:** A category with products cannot be deleted: the service checks first and the API answers 409, and a `Restrict` foreign key also stops it. The category list is paginated like every list, with up to 100 per page, so the product form's menu gets all of them from one page. The owner is read from the token's `sub` claim when a product is created and never changes. The demo product seed was removed, since a product needs an owner and the admin is created after the migrations.
- **Verification:** Claude wrote the code and I approved each change, after each part had been built and tested in copies outside the repo. The migration was first run against a temporary local PostgreSQL: the existing products got "Övrigt" and the admin (not another user), and without an admin nothing in the migration was saved. Removing a rule (the products check, the category checks, the owner, `MarkAsUpdated`, the form's `required`) made exactly the matching tests fail.
- **Learning:** EF Core gives new required columns placeholder values, so existing rows need hand-written SQL in the migration before the foreign keys are added. Signal Forms reads a `<select>` as text and selects the right option again when the options arrive later. `whenStable()` waits for every open HTTP request, so the test that shows the form before the categories arrive updates the page with `detectChanges()` instead.

## 2026-10-29

- **Building:** Finished sprint 2 item 6. The admin manages lists of materials and colors in the CMS (`/api/admin/materials` and `/api/admin/colors`) and ticks several of each, or none, in the product form. The product page in the shop shows them as "Material" and "Färg". Verified locally and in production.
- **Design:** Materials and colors are alike (an id and a name), so I chose to write the code once with generics: one repository, service and abstract controller in the API, and one list page, form and checkbox component in Angular that get the kind from the route. A material or a color can be deleted even if products have it, since a product does not need one. I asked for a warning first, so the API sends how many products have it, and the form asks "2 produkter har "Lera", och materialet tas bort från dem också…" before anything is deleted.
- **Verification:** Claude wrote the code and I approved each change, after each part had been built and tested in a copy outside the repo. The migration was first run against a temporary local PostgreSQL. The integration tests are written once in an abstract test class and run for both materials and colors. Breaking the "den/dem" wording and the checkbox toggle made exactly the matching Angular tests fail.
- **Learning:** A component can work as a form field in Signal Forms by implementing `FormValueControl` with a `model()` called `value`. The checkboxes are only created when the product has arrived, so the test waits for their requests with `vi.waitFor`.

## 2026-10-30

- **Building:** Finished sprint 2 item 7: shared style variables for colors, fonts and spacing in `client/src/styles/`, base styles for plain HTML elements, and a small component library in `shared/`. A button in three variants is used for every button in the shop and the CMS, and a pagination component replaced four copies of the same markup. Verified locally and in production.
- **Design:** I chose a small library of our own instead of Angular Material, since Material would have meant rewriting every form, and the shop should get its own look. The variables are CSS custom properties instead of Sass variables, so every component can use them while the app runs, and dark mode only needs new values. The button is an attribute on a real `<button>` (`<button appButton>`), the same idea as Angular Material, so disabled, form submit and `routerLink` work as before. Claude checked the contrast of every color pair against WCAG AA.
- **Verification:** Claude wrote the code and I approved each change, after each part had been built and tested in a copy outside the repo. The existing tests passed unchanged, which showed that the button and the pagination did not change any behaviour; the product list test still finds `/produkter?sida=1`.

## 2026-11-02

- **Planning:** Sprint 2 is done except the own visual design, which was never decided at the checkpoint on 23 Oct. It is only design work (sketches, colors and fonts), not code, so it moved to sprint 3 and is decided by Wed 4 Nov.
- **Planning:** I wanted the shop to have realistic content instead of a few quick test products, and a way to start over, like Laravel's `migrate:fresh --seed`. Claude explained that a reset is normal against a development database but never against production, and that local development and the deployed shop share one database. Since everything in the shop is demo content, I chose to keep one database and accept that a reset also resets the deployed shop. Demo data became the first item of sprint 3, limited to the catalog. Demo orders are added with the order list, and real test purchases are made by hand, since a script cannot complete a Stripe Checkout payment.
- **Building:** Finished sprint 3 item 1. `reset-demo` empties the shop and fills it with 40 products in 5 categories from a JSON file, with placeholder images I made in Figma. Verified locally and in production.
- **Verification:** Built and tested in a copy first, and the reset was run against a temporary local PostgreSQL: the ids start over, the admin is kept, and a failed upload leaves the old content. New tests check the JSON against the CMS's rules.
- **Building:** Finished sprint 3 item 2. The CMS has an order list, showing by default the paid orders that are not shipped yet, oldest first, or all orders, and a page per order with the customer, address and rows. Verified locally with a test purchase.
- **Design:** I moved the demo orders to the next item, so they can be shipped and cancelled too.
- **Verification:** Built and tested in copies first, and the list's SQL was checked against a temporary local PostgreSQL.
- **Building:** Finished sprint 3 item 3. The admin marks paid orders as shipped or cancels them in the CMS, and cancelling puts the products back in stock. A cancelled paid order is shown as "Behöver återbetalas". `reset-demo` now also adds six demo orders. Verified locally.
- **Design:** I decided that the admin can only cancel paid orders, since an unpaid order can still be paid in Stripe, and that the default list "Att göra" also shows orders to refund. The rules are in `Order`, and the CMS only shows the buttons the API allows.
- **Verification:** Every part was built and tested in a copy first. Removing the stock increase made two tests fail.

## 2026-11-03

- **Building:** Finished sprint 3 item 4. When the admin refunds a payment in Stripe, the webhook `charge.refunded` marks it as `Refunded`, and the order leaves "Att göra". Verified locally and in production.
- **Design:** The refund event only knows Stripe's PaymentIntent, not the Checkout session, so I chose to store the PaymentIntent id when the order is paid instead of asking Stripe's API. I also decided that an order refunded before it is cancelled can still be cancelled, so its stock comes back, and that "Att göra" shows it as "Behöver avbrytas". Partial refunds are ignored.
- **Verification:** Every part was built and tested in a copy first. In the local test, Render's old code sometimes handled the payment first and stored no id, and the event ids showed that I had once refunded the wrong payment in Stripe. Both were test problems, not bugs.
- **Verification:** Finished sprint 3 item 5. In production I bought several products with a test card, saw the paid order in "Att göra", marked it as shipped and checked that the stock had decreased. I also tested both refund flows there. All Must items are done, one day before the checkpoint on Wed 4 Nov.

## 2026-11-04

- **Building:** Chose my own design over plan B. Built the start page from my Figma design: a shop layout with header and footer (the CMS has none), the design's neutral colors and fonts as variables, and the four newest products from the API. Verified locally on desktop and phone width.
- **Design:** I removed the accent colors so everything is neutral for now, and only kept links that lead somewhere; the categories link to the product list until the filter is built.
- **Verification:** Claude compared screenshots with the Figma design in Chrome; the dots on "TRÄ" touched the line, which I spotted and we fixed.

## 2026-11-05

- **Building:** Replaced all old style variables with the variables and text styles from my Figma file, with the same names as Figma's Code syntax and mobile first (768 / 1024 px). Every component, the CMS included, now uses them.
- **Verification:** Claude read the values from Figma and measured each page in Chrome at 390, 768 and 1440 px against the frames. This found two problems: the footer's big "GREJ." was too wide, and the dots on "TRÄ" reached the line above.
- **Design:** Figma has no hover or focus states, so I chose to use the design's own colors for them. I kept the sold-out layer at 70 %, since Figma's 100 % hides the picture.

- **Building:** Styled the product page after Figma: breadcrumb, gallery, stock status with a new yellow color, quantity stepper, a short description with "Mer information", and a buy row that is sticky on a phone.
- **Design:** I changed Figma's mobile buy bar: the normal buy row stays at the bottom until it reaches its place, so there are never two buy buttons. I also made the stepper's buttons square.
- **Verification:** Claude measured the page at 320–1440 px against Figma. This found that long words made the page scroll sideways and that the sticky row covered the screen at a big zoom; both are fixed.

## 2026-11-06

- **Building:** Finished the Should item "Filter products by category". The shop has category tabs and, on a computer, a filter column with checkboxes, both from my Figma design; the start page's categories now come from the API and link to the filter. Verified locally.
- **Design:** I chose to let the customer pick several categories ("or"), with the choice only in the URL, so the back button works. The filter drawer for phones waits until there are more filters to show in it.
- **Verification:** Every part was built and tested in a copy first, and Claude measured the tabs and the column against Figma at 320–1440 px. A test found that screen readers would have read "Keramik8" without a space.
- **Building:** Finished the last Should item in sprint 3, subcategories (one level). The admin adds them from a main category's own page, and the shop's filter column shows them under their main category; choosing a main category also shows its subcategories' products. Verified locally.
- **Design:** My first version, a "Huvudkategori" menu in the category form, felt backwards, so I drew the admin pages in Figma and we built the admin layout (menu) and the category pages after it, with the card on top on narrow screens.
- **Verification:** Every part was built and tested in a copy first, and Claude measured the pages at 320–1440 px. I found that the list rows were cramped at 1100 px, which we fixed with container queries.

##2026-11-08

Switched from a Figma-first to a code-first workflow. The rules for responsive design, WCAG and components were gathered in the skill grej-ui, so they apply to every UI change without me repeating them. Claude then removed the Figma references from the code comments and replaced the palette colors in the hover styles with tokens.

- **Building:** Finished sprint 4 item 1: filter by price, material and color, with a price slider whose fields and thumbs follow each other, and a filter panel on phones and tablets. Verified locally.
- **Design:** I chose the slider's range (up to the highest price of the other choices), that a ticked subcategory narrows its main category, a filter button that stays below the header on phones, and the same slide-in for every side panel.
- **Verification:** Every part was tested, and Claude checked 320–1440 px and 200 % zoom in Chrome. A check found the slider's black bar drawn over the thumbs, which we fixed.

## 2026-11-09

- **Building:** Finished sprint 4 item 2: every admin page now has the shop's look (overview with numbers, product list and page, orders, login). I added our own confirm dialog instead of the browser's, a toast that shows when something is saved, and the product page now stays open after saving and takes an image already when a product is created.
- **Verification:** Claude checked every page at 320–1440 px in Chrome without changing the shared database. This found a class name clash that broke the product rows and a test that sometimes hung, which we fixed.

- **Building:** Finished sprint 4 item 3: search products by name, as a search field at the top of the filter. Chosen filters as chips with ×, a box when nothing matches, the counts in small squares on the Filter and cart buttons, Material and Färg folded, and subcategories only under a ticked main category. Verified locally.
- **Design:** Noticed the page jumping while a filter loaded; Claude measured that the list was replaced by a loading text, so the old products now stay until the new ones come.
- **Verification:** Claude tested in Chrome at 320–1440 px and found two bugs the tests had missed: the browser's own search event put "[object Event]" in the URL, and the search field's focus ring was hidden under the heading.

- **Building:** Finished sprint 4 item 4, but changed it from a fixed price to shipping by the packed weight and size, with volume weight like PostNord. The admin enters the parcel in the product form, the API calculates the shipping in the checkout and sends it to Stripe as its own row, and the cart and the order page show it. Verified locally.
- **Design:** I changed the scope after Claude looked up how carriers price parcels, since a big painting costs far more to send than a ring. The cart uses a copy of the rule to avoid an extra request, but the amount from the API is the one that is paid and shown in checkout.
- **Verification:** The same examples are tested in C# and TypeScript, so the two copies of the rule cannot drift apart. Claude's check in Chrome found a double line above the order's sums on phones.

## 2026-11-10

- **Building:** Finished sprint 4 item 5, the last one before the feature freeze: up to 10 images per product. The admin adds, removes and moves them up and down in the CMS, the first one is the main image in the lists and the cart, the gallery's thumbnails scroll, and the demo data can give a product several images. Verified locally.
- **Design:** I chose up/down buttons over dragging, and asked for an info button that explains alt text. Claude suggested a box that opens on click instead of hover, since phones and keyboards have no hover.
- **Verification:** Claude's check in Chrome at 320–1440 px and 200 % text found that the thumbnail row made the phone page 930 px wide, that the "Huvudbild" label overflowed and that the help box went outside the window, all fixed.

- **Building:** Built the item dropped from sprint 4: an order paid after another customer had bought the last item is flagged "Dubbelsåld" in the CMS, with a note on what to do. Verified locally with two Stripe Checkout tabs for the same last item.
- **Design:** The order paid last is flagged, since the first customer should get the item. The flag is only a warning, since a maker may be able to make one more. I dropped Claude's habit of building everything in a copy first, since it doubled the work now that Claude writes the code.
- **Verification:** Tests cover the flag from the webhook to the CMS. Claude's own check missed old comments, which I had to ask it to clean up.

- **Building:** Added a link from the order page in the CMS to the payment in the Stripe dashboard, and sent the order number to the payment itself, so it shows in Stripe's payment list. Verified locally with a test purchase.
- **Design:** The API builds the link behind an interface, so only Infrastructure knows about Stripe and the tests run without a Stripe key. I asked Claude to clean the comments in every file from the first part of every plan, after reminding it again.
- **Verification:** Claude's check in Chrome found that the link stuck out of its card at 200 % text, which we fixed.

- **Building:** Added an order search to the CMS: the admin finds an order by its number, the customer's name or email, or a product on it, within the chosen tab, and sees the number of hits. The shop's search field became a shared component. Verified locally against the database.
- **Design:** I asked for the search to the right of the tabs on a computer, at full width on its own row when it wraps, and for the number of hits. Claude placed "Rensa sökningen" below the field so the row doesn't jump.
- **Verification:** Claude's check in Chrome at 320–1440 px and 200 % text found that the search field widened the page with large text, which we fixed.

- **Building:** Added sorting to the shop's product list: newest first, lowest or highest price, from a box in the toolbar. The select lists in the shop and the CMS got the same look as the other popovers in Chrome. Verified locally against the database.
- **Design:** I chose the three sorts and two rows in the toolbar on a phone. Claude kept a real <select> and moved its style to a shared file. When the restyled list made the box change width with each choice, Claude gave it the width of the longest choice.
- **Verification:** Claude's check in Chrome at 320–1440 px and 200 % text found that the box went past the screen's edge, which we fixed. axe was not run.

- **Building:** Product images. All product images use one 5:6 shape (`--ratio-product-image`, `object-fit: cover`), so the gallery has no white bars. Product cards show the second image on hover, and the CMS tells the admin which shape to upload. New demo images are spread over the products. I tried a slower fade with a zoom, but it felt laggy, so it went back to a 0.2 s fade.

## 2026-11-11

- **UI polish:** page background = header color, lower header with a smaller logo, the whole sort box opens the list (Enter too), Filter beside the count with only the sort wrapping, the toolbar no longer sticky, and the product page's buy row stays below the header (`main` isolated).
- **Verification:** build + affected specs, Chrome at 320–1440 px and 200 % text. axe and ESLint not run.

- **Building:** Zoom on the product images. "Förstora bilden" opens ImageViewer, a dialog over the dimmed page. It shows the whole image, the arrows step through the images, and a click zooms 2× at the clicked point. A click around the image closes it. IconButton got a filled option.
- **Verification:** Claude checked 320–1440 px, 200 % zoom and text, and the keyboard in Chrome. The check found that the zoom shrank on tablets and that the dialog got too wide with large text; both are fixed.