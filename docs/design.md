# Design – GREJ

The design is the Figma file GREJ – Webshop design (<link>). The pages Shop and Admin show only what is built; everything else is on Arkiv – idéer. The rules for all Figma work and the page-by-page workflow are in the skill `grej-figma` (`.claude/skills/grej-figma/`).

## Figma pages

| Page | What it holds |
|---|---|
| Foundations | Variables and text styles, with the same names as `_tokens.scss` and `_typography.scss` |
| Shop | The built shop pages at 390, 768 and 1440 px |
| Admin | The built admin pages |
| Arkiv – idéer | Ideas and old versions. Never built from directly |

## Components

| Code | Figma |
|---|---|
| `Button` | Button |
| `ProductCard` | Product card, Add to cart button |
| `CategoryTabs` | Category tabs |
| `ProductFilters` | Filters, Filter panel |
| `AdminNav` | Admin sidebar, Admin app bar |
| `AdminPageHeader` | Top bar |
| `LinkButton` | LinkButton |

The rest are filled in the first time a page with them is synced.

## Pages

| Page | Route | Status |
|---|---|---|
| Shop layout: header, footer, mobile menu | every shop page | Built, not synced |
| Start page | `/` | Built, not synced |
| Product list | `/produkter` | Built, not synced |
| Product page | `/produkter/:id` | Built, not synced |
| Cart and the "added to cart" popup | (drawer) | Built, not synced |
| Success page | `/kassa/tack` | Built, not synced |
| Admin layout: menu and app bar | every admin page | Built, not synced |
| Admin categories | `/admin/kategorier`, `/admin/underkategorier` | Built, not synced |
| Admin materials and colors | `/admin/material`, `/admin/farger` | Built, not synced |
| Admin start, products, orders | `/admin`, `/admin/produkter`, `/admin/ordrar` | Not styled |
| Admin login | `/admin/logga-in` | Not styled |

**Synced:** Figma shows exactly what the code shows. **Built, not synced:** built, but Figma can differ (see the notes below). **Not styled:** works, but has the simple look.

## What Figma cannot show

Behaviour that only exists in the code:

- The buy row on a phone is sticky at the bottom of the screen until the page reaches its place, and not sticky on screens lower than 480 px.
- The start page's band of words pauses on hover and stands still with reduced motion.
- The "added to cart" popup closes itself after 5 seconds, paused on hover or focus.
- The admin card beside a list sticks below the top bar. Figma cannot make a layer inside a grid sticky, so it is only annotated.
- Hover and focus, until they are variants on the components.

## Notes from before the page-by-page workflow

Moved from architecture.md on 7 Nov. When a page is synced, its notes here are removed: what Figma shows is not repeated, and behaviour that Figma cannot show moves up to What Figma cannot show.

### Tokens and components

The look is built on the design tokens in the Figma file (page Foundations). `client/src/styles/_tokens.scss` has every Figma variable as a CSS custom property with the same name as Figma's "Code syntax": the palette (`--color-sand`, `--color-charcoal` …), the color tokens that point at it with `var()` (`--color-bg-page`, `--color-text-primary` …), spacing named after its size in px (`--space-2` … `--space-160`), border widths, Figma's popover shadow, and the responsive font sizes and layout values (`--layout-margin`, `--layout-gutter`). The responsive ones are mobile first: the phone's values in `:root`, and new values in media queries for a tablet (from 768 px) and a computer (from 1024 px), Figma's `layout/breakpoint-min`. `_typography.scss` has one class per Figma text style (e.g. `.text-display-l`, `.text-label-s`), built by a Sass mixin; the templates put the class on the element, and `<body class="text-body-m">` gives the body text. Components only use `var(--…)` and the classes, so a change in Figma is a change in one place, and dark mode (Could) only needs new values. Every text color has at least 4.5:1 contrast against its background, and field borders and the focus ring at least 3:1 (WCAG AA). Figma has no hover or focus states, so they use Figma's own colors: dark buttons get `--color-graphite`, light ones `--color-oat`, links are underlined, and the focus ring is 2 px in `--color-border-default` (`--color-border-inverse` on the dark bands). `_base.scss` styles plain HTML elements with the variables: links, form fields, tables and the keyboard focus ring.

The component library is small and our own, in `shared/`, instead of e.g. Angular Material, so the Signal Forms forms keep their native fields. Each component matches a component in the Figma file, so a change in the design changes one file:

- `Button` is an attribute on a real `<button>` or `<a>` (`<button appButton variant="danger">`), so the element keeps the browser's keyboard handling, form submit, `disabled` and `routerLink`. It has three variants (primary, secondary with a 2 px frame, danger; the frame is taken from the padding, so all are equally tall, unlike Figma where the secondary is 4 px taller) and two sizes (normal for forms and the CMS, `size="large"` for the shop's big buttons).
- `Icon` shows one of the design's icons from `public/icons/` as a CSS mask, so it takes the text color around it. `IconButton` is a square button with only an icon (e.g. close), and always needs an `aria-label`.
- `Badge` is a small label on a product image, e.g. "Slutsåld" and "Få kvar".
- `Pagination` shows the links to the page before and after and the page numbers (`?sida=`), e.g. 1 2 3 … 8, with a shorter list on a phone. It shows nothing when the list fits on one page.
- `Breadcrumb` shows e.g. "Hem / Shop / Vas" above a page's title; the current page comes last and is not a link.
- `QuantityStepper` is the − 1 + control in the cart and on the product page (`[(quantity)]` with `min` and `max`). Its buttons are squares of `--stepper-button-size`, which the product page sets so the stepper is as tall as the large button; that makes it wider than in Figma.
- `StockStatus` is a colored dot and the stock as text: "Slutsåld" (grey), "Få kvar – 2 st" (red, 1–2 left), "I lager – 4 st" (yellow, 3–5) and "I lager – 12 st" (green, 6 or more). The yellow is `--color-feedback-warning` (`--color-ochre`), which was added to Figma for it.

### Shop

The shop's own design is made in Figma (GREJ – Webshop design) in three sizes: a phone (390 px), a tablet (768 px) and a computer (1440 px). It has neutral colors, Anton for headings, Inter for text and Space Mono for small print; the fonts are loaded from Google Fonts in `index.html`. The variables have the design's values, so the CMS gets the same colors and fonts. The Figma file also shows things that are not built yet (the material, color, price and maker filters, the filter drawer on phones and tablets, active filter chips, sorting, makers, free shipping); only what has working code is shown in the shop.

- `ShopLayout` (`features/shop/shop-layout/`) has the shop's header (logo, menu, cart) and footer. The shop's routes are its children in `app.routes.ts`, so the admin pages have no shop header. Its bands go from edge to edge, and the content inside them uses `.page-width`: centered, at most as wide as Figma's computer frame (`--layout-viewport-width`, 1440 px), with `--layout-margin` on the sides (20 px on a phone, 32 px on a tablet, 48 px on a computer). On a phone the menu links are in `MobileMenu`, a `<dialog>` like the cart.
- `ProductCard` is used by both the start page and the product list: image, title, price, a "Slutsåld" or "Få kvar" (1–2 left) badge, and an add button. The add button is a bar over the image on hover or keyboard focus on a computer, and a "+" square on a tablet and a phone, where there is no hover.
- The start page (`/`, `LandingPage`) has a big title, a moving band of words, the four newest products (the first four from `GET /api/products`, which sorts the newest first; a row to swipe through on a phone) and links to the categories from `GET /api/categories`. The band pauses on hover and stands still for people who have turned on "reduce motion".
- The product list (`/produkter`) has a breadcrumb, the title with the number of products, `CategoryTabs`, a toolbar with "Visar 1–12 av 40 grejer", and two products per row on a phone and three on a tablet and a computer. `CategoryTabs` (Figma: Category tabs) is a row of links, "Alla" plus one per category with its number; it scrolls sideways below 1024 px and wraps on a computer. From 1024 px `ProductFilters` (Figma: Filters and Filter panel, only the Kategori group) is a 288 px column to the left: "Filter" with "Rensa", and the Kategori group, which folds with a minus/plus button (`aria-expanded`), with real checkboxes styled as Figma's Checkbox (`appearance: none` and the check icon on top). When no product matches the filter, the list says so and links to all products; Figma's empty state with chips is not built.
- The product page (`/produkter/:id`) has a breadcrumb, `ProductGallery` (a big image and thumbnails to choose from, built for several images although the API has one), the title, price and `StockStatus`, the first 150 characters of the description with "Mer information" (opens "Beskrivning", a `<details>`, and scrolls to it), the material and color rows, and the buy row (`QuantityStepper` and "Lägg i varukorg"). On a phone the buy row is sticky at the bottom of the screen until the page is scrolled down to its place, where it stays; `scroll-padding-bottom` keeps the keyboard focus above it. It is not sticky on screens lower than 480 px, e.g. when zoomed in, where it would cover too much. This differs from Figma's separate buy bar with price and stock on purpose, so the page never shows two buy buttons. The maker, the "NY" badge, the size and care rows, the delivery notes and "Du kanske också gillar" are in Figma but not built, since the API has no data for them.
- The cart (`CartDrawer`) shows each row with a picture (the cart saves the product's image when it is added), a `QuantityStepper`, the total, and an empty state. When something is added, `AddedToCart` shows a small popup under the cart button that closes itself after 5 seconds (paused on hover or focus), with the cross or with Escape; it never takes the focus and is read by screen readers through `aria-live`.
- The success page (`/kassa/tack?order=…`) has a check mark, the title, the order number from the URL and "Din beställning håller på att bekräftas", "Vad händer nu?" as a numbered list (the numbers are centered against the text, not at the top as in Figma), "Fortsätt handla" and a note that the shop is a demo where no money is taken and nothing is sent. Figma's order summary, delivery and payment boxes and "Skriv ut kvitto" are not built, since the page only has the order number (there is no public endpoint for an order), and the email texts are left out, since no email is sent. Without the summary the column keeps Figma's width of 800 px on a computer.
- Each size has Figma's values for its frame: a phone up to 767 px, a tablet from 768 px and a computer from 1024 px. The font sizes change through the variables; spacing and layout changes (columns, the menu, the add button) use media queries at 48rem (768 px) and 64rem (1024 px) in the components, written phone first. The footer's big "GREJ." is at most 42 % of the screen width, so the computer's 500 px letters fit between 1024 and 1190 px.
- The Display text styles have line height 116 % (except Wordmark), so the dots on Å, Ä and Ö do not reach the row or line above. The sold-out layer over a product image differs from Figma on purpose: 70 % instead of 100 %, so the image can still be seen.

### Admin

The CMS has its own pages in the Figma file (page Admin). They use the same variables, text styles and shared components as the shop. So far the layout, the category pages and the material and color page are built after it; the other admin pages keep their simple look inside the layout until they are styled.

- `AdminLayout` (`features/admin/admin-layout/`) is the parent route of every admin page except the login page, like `ShopLayout`. From 1024 px `AdminNav` (Figma: Admin sidebar) is a 264 px menu to the left, sticky with its own scroll. Below 1024 px there is an app bar (Figma: Admin app bar) whose menu button opens the same menu as a drawer from the left, a `<dialog>` like `MobileMenu`. Kategorier and Egenskaper fold with a button (`aria-expanded`) and are open on their own pages (`isActive` and `linkedSignal`). The menu shows only pages that exist; the design's Användare och roller, Inställningar, the number of new orders and the name with initials are not built, so it shows the email and its first letter.
- `AdminPageHeader` is a page's top (Figma: Top bar): a small label, the h1 and room for the page's button. Its line reaches the edges of the main area. From 1024 px, when the window is at least 30rem high, it sticks at the top. It measures its own height with a `ResizeObserver` and writes it to `--admin-page-header-height` on `<html>`, since the row wraps when there is no room. `_base.scss` turns that into `--admin-sticky-top` (the app bar's 4rem below 1024 px), which sets `scroll-padding-top` so a focused field is never hidden under it.
- The category pages and the material and color page share `admin-category-page.scss`. The page and the list are CSS containers (`container-type: inline-size`), so `@container` places the card to the right of the list when the page is at least 56rem wide, and puts each row on one line when the list is at least 36rem wide. The layout therefore follows the room the page has beside the menu, not the screen's width. The card comes first in the HTML, so it is on top on a narrow screen and the keyboard order matches what is seen. Beside the list, in a window at least 30rem high, the card sticks 24 px below `--admin-sticky-top`, so "Redigera" on the last row still shows it. The category pages' Figma frames do not show the sticky top bar and card yet.
- Materials and colors share one page, `AdminPropertyList` (Figma: Admin / Material), with `AdminPropertyCard` (`?redigera=`) and `LinkButton` in the rows. It differs from Figma in one way: the rows have no product count, since the API's list has none yet (`ProductCount` in `PropertyDto`). "Ta bort" therefore fetches the material first, so the warning can say how many products have it. Färger has no Figma frame of its own; it uses the same design with its own words.
