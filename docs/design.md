# Design – GREJ

The design lives in the code. `client/src/styles/` has the tokens, the text styles and the base styles, `client/src/app/shared/` the shared components, and each feature component its own look. This file describes what is built. The rules for changing it are in the skill `grej-ui` (`.claude/skills/grej-ui/`).

## Tokens and text styles

- `_tokens.scss` has every design value as a CSS custom property:
  - the palette (`--color-sand`, `--color-charcoal` …), which only the color tokens use
  - the color tokens, which point at the palette with `var()` (`--color-bg-page`, `--color-text-primary` …)
  - spacing named after its size in px (`--space-2` … `--space-160`), border widths, `--size-control-height` and the popover shadow
  - the responsive font sizes and layout values (`--layout-margin`, `--layout-gutter`, `--layout-admin-gutter`, `--layout-viewport-width`)
- The responsive values are mobile first. The phone's values are in `:root`, and new values come in media queries from 768 px (tablet) and from 1024 px (computer).
- `_typography.scss` has one class per text style (e.g. `.text-display-l`, `.text-label-s`), built by a Sass mixin. The templates put the class on the element, and `<body class="text-body-m">` gives the body text. The fonts (Anton for the Display styles, Inter for text, Space Mono for small print) are loaded from Google Fonts in `index.html`. The Display styles have line height 1.16 (except Wordmark), so the dots on Å, Ä and Ö don't reach the line above.
- Components only use `var(--…)` and the classes, so a change of a value is a change in one place, and dark mode (Could) only needs new values.
- Every text color has at least 4.5:1 contrast against its background, and field borders and the focus ring at least 3:1 (WCAG AA).
- Hover: dark buttons get `--color-bg-inverse-hover` and light ones `--color-bg-hover`. Links are underlined.
- The focus ring is 2 px in `--color-border-default`, and `--color-border-inverse` on the dark bands.
- `_base.scss` styles plain HTML elements with the tokens: links, form fields, tables and the focus ring.
- Sizes: a phone up to 767 px, a tablet from 768 px and a computer from 1024 px. The font sizes change through the tokens. Changes to spacing and layout (columns, the menu, the add button) use media queries at 48rem and 64rem in the components, written phone first. The admin pages follow the room beside the menu with container queries instead.

## Shared components

The component library is small and our own, in `shared/`, instead of e.g. Angular Material, so the Signal Forms forms keep their native fields.

- `Button` is an attribute on a real `<button>` or `<a>` (`<button appButton variant="danger">`). That way the element keeps the browser's keyboard handling, form submit, `disabled` and `routerLink`. It has three variants (primary, secondary with a 2 px frame, danger) and two sizes (normal for forms and the CMS, `size="large"` for the shop's big buttons). The frame is taken from the padding, so all variants are equally tall.
- `LinkButton` (`button[appLinkButton]`) is a button that looks like a link, for actions on the same page, such as "Redigera" and "Ta bort" in a CMS list. It has `tone` default or danger.
- `Icon` shows one of the icons in `public/icons/` as a CSS mask, so it takes the text color around it. `IconButton` is a square button with only an icon (e.g. close), and always needs an `aria-label`.
- `Badge` is a small label on a product image, e.g. "Slutsåld" and "Få kvar".
- `Pagination` shows the links to the page before and after, and the page numbers (`?sida=`), e.g. 1 2 3 … 8. A phone gets a shorter list. It shows nothing when the list fits on one page.
- `Breadcrumb` shows e.g. "Hem / Shop / Vas" above a page's title. The current page comes last and is not a link.
- `QuantityStepper` is the − 1 + control in the cart and on the product page (`[(quantity)]` with `min` and `max`). Its buttons are squares of `--stepper-button-size`, which the product page sets so the stepper is as tall as the large button.
- `StockStatus` is a colored dot and the stock as text:
  - "Slutsåld" (grey)
  - "Få kvar – 2 st" (red, 1–2 left)
  - "I lager – 4 st" (yellow, 3–5 left; `--color-feedback-warning`)
  - "I lager – 12 st" (green, 6 or more)

## Shop

The shop has neutral colors. The CMS uses the same tokens, so it gets the same colors and fonts.

- `ShopLayout` (`features/shop/shop-layout/`) has the shop's header (logo, menu, cart) and footer, and the header sticks at the top. The shop's routes are its children in `app.routes.ts`, so the admin pages have no shop header.
  - Its bands reach the screen's edges. The content inside them uses `.page-width`: centered, at most `--layout-viewport-width` (1440 px), with `--layout-margin` on the sides (20 px on a phone, 32 px on a tablet, 48 px on a computer).
  - On a phone the menu links are in `MobileMenu`, a `<dialog>` like the cart.
  - The footer's big "GREJ." is at most 42 % of the screen width, so it fits between 1024 and 1190 px.
- `ProductCard` is used by both the start page and the product list. It has an image, title and price, a "Slutsåld" or "Få kvar" (1–2 left) badge, and an add button.
  - On a computer the add button is a bar over the image, shown on hover or keyboard focus. On a tablet and a phone, where there is no hover, it is a "+" square.
  - The sold-out layer over the image is 70 %, so the image can still be seen.
- The start page (`/`, `LandingPage`) has:
  - a big title
  - a moving band of words, which pauses on hover and stands still for people who have turned on "reduce motion"
  - the four newest products (the first four from `GET /api/products`, which sorts the newest first), as a row to swipe through on a phone
  - links to the categories from `GET /api/categories`
- The product list (`/produkter`) has a breadcrumb, the title with the number of products, `CategoryTabs`, and a toolbar with "Visar 1–12 av 40 grejer". It shows two products per row on a phone, and three on a tablet and a computer.
  - `CategoryTabs` is a row of links: "Alla" plus one per category with its number. It scrolls sideways below 1024 px and wraps on a computer.
  - From 1024 px, `ProductFilters` is a 288 px column to the left: "Filter" with "Rensa", and the Kategori group. The group folds with a minus/plus button (`aria-expanded`) and has real checkboxes, styled with `appearance: none` and the check icon on top.
  - When no product matches the filter, the list says so and links to all products.
- The product page (`/produkter/:id`) has:
  - a breadcrumb
  - `ProductGallery`: a big image and thumbnails to choose from. It is built for several images, although the API has one.
  - the title, price and `StockStatus`
  - the first 150 characters of the description, with "Mer information", which opens "Beskrivning" (a `<details>`) and scrolls to it
  - the material and color rows
  - the buy row: `QuantityStepper` and "Lägg i varukorg"
- The buy row on a phone:
  - It sticks at the bottom of the screen until the page is scrolled down to its place, where it stays.
  - The row itself sticks, instead of a separate buy bar, so the page never shows two buy buttons.
  - `scroll-padding-bottom` keeps the keyboard focus above it.
  - It does not stick on screens lower than 480 px (e.g. when zoomed in), where it would cover too much.
- The cart (`CartDrawer`) shows each row with a picture (the cart saves the product's image when it is added) and a `QuantityStepper`, plus the total and an empty state.
- When something is added, `AddedToCart` shows a small popup under the cart button.
  - It closes itself after 5 seconds, which pause on hover or focus. It also closes with the cross or with Escape.
  - It never takes the focus, and screen readers read it through `aria-live`.
- The success page (`/kassa/tack?order=…`) has:
  - a check mark and the title
  - the order number from the URL, with "Din beställning håller på att bekräftas"
  - "Vad händer nu?" as a numbered list
  - "Fortsätt handla"
  - a note that the shop is a demo, where no money is taken and nothing is sent
- The success page has no order summary, since it only has the order number (there is no public endpoint for an order). It has no email texts, since no email is sent.

## Admin

The CMS uses the same tokens, text styles and shared components as the shop.

- `AdminLayout` (`features/admin/admin-layout/`) is the parent route of every admin page except the login page, like `ShopLayout`.
  - From 1024 px, `AdminNav` is a 264 px menu to the left, sticky with its own scroll.
  - Below 1024 px there is an app bar. Its menu button opens the same menu as a drawer from the left, a `<dialog>` like `MobileMenu`.
  - Kategorier and Egenskaper fold with a button (`aria-expanded`), and are open on their own pages (`isActive` and `linkedSignal`).
  - The menu shows the admin's email and its first letter.
- `AdminPageHeader` is a page's top: a small label, the h1 and room for the page's button. Its line reaches the edges of the main area.
  - From 1024 px, when the window is at least 30rem high, it sticks at the top.
  - It measures its own height with a `ResizeObserver` and writes it to `--admin-page-header-height` on `<html>`, since the row wraps when there is no room.
  - `_base.scss` turns that height into `--admin-sticky-top` (the app bar's 4rem below 1024 px). That value sets `scroll-padding-top`, so a focused field is never hidden under the header.
- The category pages and the material and color page share `admin-category-page.scss`.
  - The page and the list are CSS containers (`container-type: inline-size`). The card goes to the right of the list when the page is at least 56rem wide, and each row fits on one line when the list is at least 36rem wide. So the layout follows the room the page has beside the menu, not the screen's width.
  - The card comes first in the HTML, so it is on top on a narrow screen and the keyboard order matches what is seen.
  - Beside the list, in a window at least 30rem high, the card sticks 24 px below `--admin-sticky-top`, so "Redigera" on the last row still shows it.
- Materials and colors share one page, `AdminPropertyList`, with `AdminPropertyCard` (`?redigera=`) and `LinkButton` in the rows.
  - The rows have no product count yet, since `PropertyDto` has none.
  - "Ta bort" therefore fetches the material first, so the warning can say how many products have it.
- Not styled yet: the admin start page, products, orders and the login page keep the simple look inside the layout. They are styled with the same parts: `AdminPageHeader`, and the list with a card beside it where a page edits rows.
