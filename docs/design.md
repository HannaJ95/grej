# Design – GREJ

The design lives in the code. `client/src/styles/` has the tokens, the text styles and the base styles, `client/src/app/shared/` the shared components, and each feature component its own look. This file describes what is built. The rules for changing it are in the skill `grej-ui` (`.claude/skills/grej-ui/`).

## Tokens and text styles

- `_tokens.scss` has every design value as a CSS custom property:
  - the palette (`--color-linen`, `--color-charcoal` …), which only the color tokens use
  - the color tokens, which point at the palette with `var()` (`--color-bg-page`, `--color-text-primary` …)
  - spacing named after its size in px (`--space-2` … `--space-160`), border widths, `--size-control-height`, `--ratio-product-image` and the popover shadow
  - the responsive font sizes and layout values (`--layout-margin`, `--layout-gutter`, `--layout-admin-gutter`, `--layout-viewport-width`)
- The responsive values are mobile first. The phone's values are in `:root`, and new values come in media queries from 768 px (tablet) and from 1024 px (computer).
- `_typography.scss` has one class per text style (e.g. `.text-display-l`, `.text-label-s`), built by a Sass mixin. The templates put the class on the element, and `<body class="text-body-m">` gives the body text. The fonts (Anton for the Display styles, Inter for text, Space Mono for small print) are loaded from Google Fonts in `index.html`. The Display styles have line height 1.16 (except Wordmark), so the dots on Å, Ä and Ö don't reach the line above.
- Components only use `var(--…)` and the classes, so a change of a value is a change in one place, and dark mode (Could) only needs new values.
- The page and the surfaces (header, cards, fields) share one background, linen, so cards and fields stand out by their borders.
- Every text color has at least 4.5:1 contrast against its background, and field borders and the focus ring at least 3:1 (WCAG AA).
- Hover: dark buttons get `--color-bg-inverse-hover` and light ones `--color-bg-hover`. Links are underlined.
- The focus ring is 2 px in `--color-border-default`, and `--color-border-inverse` on the dark bands.
- Every product image in the shop (cards, gallery, cart) has the same portrait shape, `--ratio-product-image` (318 / 380, about 5:6), and fills it with `object-fit: cover`. An image of another shape is cropped from the middle instead of getting bars, so the shop looks the same whatever is uploaded. The main image looks best with the product on white; the other images can show it in use or up close.
- `_base.scss` styles plain HTML elements with the tokens: links, form fields, tables and the focus ring. It also has `.visually-hidden`, for text that only screen readers get.
- Sizes: a phone up to 767 px, a tablet from 768 px and a computer from 1024 px. The font sizes change through the tokens. Changes to spacing and layout (columns, the menu, the add button) use media queries at 48rem and 64rem in the components, written phone first. The admin pages follow the room beside the menu with container queries instead.

## Shared components

The component library is small and our own, in `shared/`, instead of e.g. Angular Material, so the Signal Forms forms keep their native fields.

- `Button` is an attribute on a real `<button>` or `<a>` (`<button appButton variant="danger">`). That way the element keeps the browser's keyboard handling, form submit, `disabled` and `routerLink`. It has three variants (primary, secondary with a 2 px frame, danger) and two sizes (normal for forms and the CMS, `size="large"` for the shop's big buttons). The frame is taken from the padding, so all variants are equally tall.
- `LinkButton` (`button[appLinkButton]`) is a button that looks like a link, for actions on the same page, such as "Redigera" and "Ta bort" in a CMS list. It has `tone` default or danger.
- `Icon` shows one of the icons in `public/icons/` as a CSS mask, so it takes the text color around it. Arrows and other symbols beside a label are icons, never characters such as →, which Inter's web font lacks, so each browser would draw its own. Inside `Button` an icon is 1.25 times the label's size. `IconButton` is a square button with only an icon (e.g. close), and always needs an `aria-label`. `filled` gives it the surface color, for a button on an image or the dimmed page.
- `InfoTip` is a small (i) button beside a label that opens a box of help text (`<app-info-tip label="Vad är alt-text?">`). It opens on click, tap or Enter, not on hover, which touch screens and keyboards lack.
  - The box is a native popover, so the browser closes it on Escape or a click outside.
  - From a tablet it sits by the button with CSS anchor positioning: below and to the right, or flipped to where it fits.
  - On a phone, and when nothing beside the button fits (e.g. with large text), it is in the middle of the window, and it scrolls inside when it is taller than the window.
- `Badge` is a small label on a product image, e.g. "Slutsåld" and "Få kvar".
- `SearchField` is a `<form role="search">` with the search icon in a field box (`<app-search-field label="Sök bland grejerna">`), used by the shop's filter and the CMS's order list.
  - It has no visible label, so `label` becomes the field's `aria-label`.
  - Like the price fields, it searches on Enter or when the field is left, so a list doesn't reload for every letter.
  - It has no clear button of its own; each page clears the search its own way.
- `Pagination` shows the links to the page before and after, and the page numbers (`?sida=`), e.g. 1 2 3 … 8. A phone gets a shorter list. It shows nothing when the list fits on one page. With `fragment`, its links lead to that id on the page instead of the top; the router's offset is `scroll-padding-top` (`app.config.ts`), so the id lands just below the sticky header.
- `Breadcrumb` shows e.g. "Hem / Shop / Vas" above a page's title. The current page comes last and is not a link.
- `QuantityStepper` is the − 1 + control in the cart and on the product page (`[(quantity)]` with `min` and `max`). Its buttons are squares of `--stepper-button-size`, which the product page sets so the stepper is as tall as the large button.
- `StockStatus` is a colored dot and the stock as text:
  - "Slutsåld" (grey)
  - "Få kvar – 2 st" (red, 1–2 left)
  - "I lager – 4 st" (yellow, 3–5 left; `--color-feedback-warning`)
  - "I lager – 12 st" (green, 6 or more)
- `shared/drawer.scss` is shared by the side panels, which are `<dialog>`s: the cart, the filter panel, the phone menu and the admin menu.
  - Each panel slides in from its side (`--drawer-from`) while the backdrop fades in, and back out when it closes.
  - Firefox and Safari close the panel at once, without the slide.
  - "Reduce motion" turns the slide off.
- While any modal `<dialog>` is open (the side panels, `ImageViewer`, `ConfirmDialog`), the page behind it does not scroll, also when the dialog's own list reaches its end (`html:has(dialog:modal)` in `_base.scss`).
- `shared/field-box.scss` is a text field in a framed box, used by the price fields and the search. The box is the label, so a click anywhere in it reaches the field, and the focus ring goes around the whole box.
- `shared/select.scss` is a `<select>` with the chevron icon instead of the browser's own arrow, used by the CMS forms and the shop's sort.
  - In Chrome it is a customizable select (`appearance: base-select`), still a real `<select>`. Its list looks like the other popovers: a 2 px frame, the surface color and `--shadow-popover`, the hover color on the row under the mouse or the keyboard, and the check icon on the chosen one. It opens below the field when it fits, and the chevron turns while it is open.
  - Other browsers show their own list.
- `shared/checkbox.scss` is the square checkbox (a real checkbox with `appearance: none` and the check icon on top), used by the shop's filter and the CMS's product form.
- `shared/tabs.scss` is a row of bordered links where the current one (`aria-current="page"`) is dark, used by the shop's category tabs and the CMS's order list.
- `ConfirmDialog` is our own `confirm()`. A page asks with `await confirm.ask({ title, message, hint, confirmLabel })` (`ConfirmService`) and gets true or false.
  - It is a modal `<dialog>`: the focus stays inside it, Escape and the cross close it, and the focus goes back to the button that asked.
  - The focus starts on "Avbryt", so Enter never removes anything by mistake. The confirm button is red for what removes something and dark for other changes.
  - On a phone the buttons are under each other in full width.
- `Toast` says that something worked: `toast.show('Ändringarna är sparade.')` (`ToastService`). Its check has the green of the stock status dot.
  - It is shown in the bottom corner for 5 seconds, pauses on hover or focus, and closes with the cross or Escape, like `AddedToCart`.
  - Screen readers hear it through `aria-live`, and it never takes the focus.
  - Only successes are toasts. Errors stay next to what went wrong (`role="alert"`) until they are read.

## Shop

The shop has neutral colors. The CMS uses the same tokens, so it gets the same colors and fonts.

- `ShopLayout` (`features/shop/shop-layout/`) has the shop's header (logo, menu, cart) and footer, and the header sticks at the top. The shop's routes are its children in `app.routes.ts`, so the admin pages have no shop header.
  - The header is the same low height on every screen size: the logo is smaller on a phone, and from a tablet it is as tall as the cart button. That height is `--shop-sticky-top` in `_base.scss`. `scroll-padding-top` uses it, so a focused element is never hidden under the header.
  - `<main>` is one layer below the header (`isolation: isolate`), so nothing on a page, such as the product page's sticky buy row, can scroll over it.
  - Its bands reach the screen's edges. The content inside them uses `.page-width`: centered, at most `--layout-viewport-width` (1440 px), with `--layout-margin` on the sides (20 px on a phone, 32 px on a tablet, 48 px on a computer).
  - On a phone the menu links are in `MobileMenu`, a `<dialog>` like the cart.
  - The footer's "Shop" lists "Alla produkter" and the five categories with the most products, in name order, each linking to the product list with that category chosen.
  - The footer's big "GREJ." is at most 42 % of the screen width, so it fits between 1024 and 1190 px. It is decoration and takes no clicks, since its letters reach up over the links above.
  - On screens wider than 1440 px the bands (header, start page, moving band, footer) still reach the edges while the content stays centered, so the page keeps one pattern instead of a box in the middle.
- `ProductCard` is used by both the start page and the product list. It has an image, title and price, a "Slutsåld" or "Få kvar" (1–2 left) badge, and an add button.
  - On a computer the add button is a bar over the image, shown on hover or keyboard focus. On a tablet and a phone, where there is no hover, it is a "+" square.
  - The card fills its grid row, and the price sits at its bottom. A long title therefore never moves the price or the add button out of line with the rest of the row.
  - The sold-out layer over the image is 70 %, so the image can still be seen.
  - With a mouse, the product's second image fades in over the first on hover or keyboard focus. Touch screens never show or download it; the product page's gallery has it.
- The start page (`/`, `LandingPage`) has:
  - a big title
  - a moving band of words, which pauses on hover and stands still for people who have turned on "reduce motion"
  - the four newest products (the first four from `GET /api/products`, which sorts the newest first), as a row to swipe through on a phone
  - links to the categories from `GET /api/categories`
- The product list (`/produkter`) has a breadcrumb, the title with the number of products, `CategoryTabs`, and a toolbar with "Visar 1–12 av 40 grejer" ("0 grejer hittades" when nothing matches). It shows two products per row on a phone, and three on a tablet and a computer.
  - Screen readers hear the toolbar's count after each choice (`aria-live`).
  - A new page from `Pagination` starts at the toolbar (`#grejer`), not at the top, and the focus moves to the toolbar, so Tab goes on into the new products. Back returns to where the customer was.
  - While a new choice loads, the old products and the count stay, so the page doesn't jump. The products fade only if the answer takes more than 0.3 s.
  - From 1024 px the toolbar also shows the chosen filters as chips (`ActiveFilters`). × removes one and moves the focus to the chip beside it, and "Rensa alla" removes them all. The sort box is taller than a row of chips, so the toolbar doesn't grow with the first choice.
  - `SortSelect` at the end of the toolbar sorts the list: "Nyast först", "Lägst pris" or "Högst pris" (`?sortera=`).
    - It is a field box, "Sortera: Nyast först", with a `shared/select.scss` select. On a phone only the choice shows; "Sortera" is the select's `aria-label` everywhere. A click anywhere in the box, "Sortera:" too, opens the list, and a click while it is open closes it. Enter, Space and the arrows open it from the keyboard; in the list the arrows move between the choices and Enter chooses one.
    - It keeps the width of the longest choice, so it doesn't jump when the choice changes, but shrinks with large text on a narrow screen.
    - A new sort starts on page 1. "Rensa", the chips and the tabs keep it.
  - `CategoryTabs` is a row of links: "Alla" plus one per category with its number. It scrolls sideways below 1024 px and wraps on a computer. A tab keeps the other filters.
  - `ProductFilters` has "Filter" with "Rensa", which removes every choice, the search field, and the groups Kategori, Pris, Material and Färg. A group without choices is left out.
  - The search is a `SearchField`, "Sök bland grejerna".
  - Each group is a `FilterGroup`. The minus/plus button in its heading (`aria-expanded`) folds it with a short height animation, and the folded content is `inert`. Material and Färg start folded, unless something in them is already chosen.
  - The rows are `FilterOption`s: real checkboxes, styled with `appearance: none` and the check icon on top, with the number of products.
  - Kategori shows a main category's subcategories under it once the main category is ticked: indented, one text size smaller, and unfolding with the same height animation (`animate.enter` and `animate.leave`). Ticking one shows only the chosen subcategories.
  - Pris is `PriceRange`: two fields ("0 kr – 700 kr") and a slider with two square thumbs, which follow each other.
    - The slider goes from 0 to the highest price among the products of the other choices, rounded up to 100 kr.
    - A thumb is applied when it is let go, and a field on Enter or when the customer leaves it.
    - A thumb stops at the other one. Typing moves the thumb at once but never changes the text being typed.
  - From 1024 px, `ProductFilters` is a 288 px column to the left.
  - The toolbar has no lines and scrolls away with the page on every screen size. The count, Filter and the sort share one row, Filter and the sort to the right. When there is no room, Filter and the sort move together to a row above the count, still to the right.
  - Below 1024 px the toolbar has "Filter", with the number of choices beside the word once something is chosen ("Filter 3"). The button's `aria-label` says what the number is: "Filter, 3 valda".
    - The button opens `FilterDrawer`, a `<dialog>` from the left with the same `ProductFilters`. It covers the whole screen on a phone and is a 26rem panel on a tablet.
    - Every choice updates the list behind the panel at once. The heading and the close button stick while the filter scrolls, and "Visa 24 grejer" at the bottom closes the panel.
  - When no product matches the filter, `NoResults` shows a framed box:
    - "Inga grejer hittades" and what was chosen, e.g. "Vi hittade inget som matchar Konst, max 150 kr och Svart"
    - "Rensa alla filter", which moves the focus to the toolbar's count, since the button disappears
    - with more than one choice, light chips to remove one at a time
- The product page (`/produkter/:id`) has:
  - a breadcrumb
  - `ProductGallery`: a big image and a thumbnail for each of the product's images (up to 10), the main image first.
    - Below 1024 px the thumbnails are a row that scrolls sideways, like `CategoryTabs`. From 1024 px they are a column beside the big image, as tall as it, which scrolls up and down.
    - The scrolling box has room around the thumbnails, so it never cuts the focus ring.
    - "Förstora bilden", a filled `IconButton` in the big image's corner, opens `ImageViewer`. The whole image is its click area, and the image keeps its alt text.
  - `ImageViewer`, a modal `<dialog>` over the dimmed page with the whole, uncropped image as big as the screen allows.
    - At the top "Zooma in" (`aria-pressed`) and the cross. Below, with more than one image, the arrows around "Bild 2 av 5". The arrows go round from the last image to the first, so they are never disabled.
    - A click on the image zooms to twice the size and keeps the clicked point under the pointer. The zoomed image scrolls with the wheel, a finger or the arrow keys, and the page behind stays still. Another image, or closing, fits it again.
    - A click on the dimmed page around the image, the cross or Escape closes it, and the focus goes back to "Förstora bilden". The gallery then shows the image the viewer closed on.
  - the title, price and `StockStatus`
  - the first 150 characters of the description, with "Mer information", which opens "Beskrivning" and scrolls to it
  - the buy row: `QuantityStepper` and "Lägg i varukorg"
  - three folds (`<details>`), closed at first, which open and close with the same short height animation as `FilterGroup`. Reduced motion turns it off, and browsers without `::details-content` open them at once.
    - "Beskrivning": the whole description.
    - "Detaljer": only the rows the product has, i.e. Material, Färg, Mått and Vikt. Mått is e.g. "Ø 8 × H 9 cm", with the height last, and screen readers hear "diameter 8 cm, höjd 9 cm" instead. Vikt is in kg from 1 000 g. The fold is left out when the product has none of them.
    - "Frakt och retur": Leverans (Paket till ombud), Frakt (this product alone, from its packed size with the cart's copy of the shipping rule) and Ångerrätt (14 dagar), with a sentence that several products are counted as one parcel in the cart.
- The buy row on a phone:
  - It sticks at the bottom of the screen until the page is scrolled down to its place, where it stays.
  - The row itself sticks, instead of a separate buy bar, so the page never shows two buy buttons.
  - `scroll-padding-bottom` keeps the keyboard focus above it.
  - It does not stick on screens lower than 480 px (e.g. when zoomed in), where it would cover too much.
- The cart (`CartDrawer`) shows each row with a picture (the cart saves the product's main image when it is added) and a `QuantityStepper`, plus the products, the shipping and the total, and an empty state. Its button in the header is only a bag icon with the number of products beside it, also when the cart is empty, with no box or background. Both get the secondary text color on hover, and the whole button is the click area. Its `aria-label` says "Varukorg, 2 grejer". On a phone it is as tall as the menu button beside it, and from a tablet the number lines up with the page's edge.
  - The shipping is a copy of the API's rule (`core/shipping.ts`), only for showing. A row saved before shipping was built has no parcel, and then the cart shows the sum and "Frakten läggs till i kassan."
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
  - It holds `ConfirmDialog` and `Toast` once for every admin page, so a toast stays when the page changes.
  - From 1024 px, `AdminNav` is a 264 px menu to the left. It is exactly the window's height and stays still while the page scrolls; it only scrolls on its own when its content is taller than the window.
  - Below 1024 px there is an app bar. Its menu button opens the same menu as a drawer that slides in from the left, a `<dialog>` like `MobileMenu`.
  - Kategorier and Egenskaper fold with a button (`aria-expanded`), and are open on their own pages (`isActive` and `linkedSignal`).
  - The menu shows the admin's email and its first letter.
- `AdminPageHeader` is a page's top: a small label, the h1 and room for the page's button. Its line reaches the edges of the main area.
  - From 1024 px, when the window is at least 30rem high, it sticks at the top.
  - It measures its own height with a `ResizeObserver` and writes it to `--admin-page-header-height` on `<html>`, since the row wraps when there is no room.
  - `_base.scss` turns that height into `--admin-sticky-top` (the app bar's 4rem below 1024 px). That value sets `scroll-padding-top`, so a focused field is never hidden under the header.
- The admin pages share three style files in `features/admin/`:
  - `admin-page.scss`: the page and every `.card` are CSS containers (`container-type: inline-size`), plus the columns, the list rows and the text links with an icon (`.back` to a list, `.icon-link`).
  - `admin-form.scss`: the form fields, hints and error texts. The selects also use `shared/select.scss`.
  - `admin-table.scss`: a table in a card. When the card is narrower than 36rem (44rem for the six columns of `.table.wide`), each row becomes a small block with two columns, and the column headings are kept for screen readers only. Each cell's own text says what it is ("2 st", "349 kr/st").
- So the layout follows the room the page has beside the menu, not the screen's width. On the category pages the card goes to the right of the list when the page is at least 56rem wide, and each row fits on one line when the list is at least 36rem wide.
  - The card comes first in the HTML, so it is on top on a narrow screen and the keyboard order matches what is seen.
  - Beside the list, in a window at least 30rem high, the card sticks 24 px below `--admin-sticky-top`, so "Redigera" on the last row still shows it.
- Materials and colors share one page, `AdminPropertyList`, with `AdminPropertyCard` (`?redigera=`) and `LinkButton` in the rows.
  - The rows have no product count yet, since `PropertyDto` has none.
  - "Ta bort" therefore fetches the material first, so the warning can say how many products have it.
- The overview (`/admin`, `AdminHome`) has three cards with numbers from lists the API already has: orders to handle, products (hidden ones too) and main categories, each with a link to its list. Each card shows its own loading and error state.
- The product list (`/admin/produkter`) is a table: a small image and the title as a link, the price, `StockStatus` (or the number sold too many in red), Synlig/Dold, and "Redigera" and "Ta bort".
- The product page (`/admin/produkter/ny` and `/admin/produkter/7`):
  - "Spara" and "Ta bort produkten" are large buttons in the top bar, like "Ny produkt" on the list. Spara sits outside the `<form>` and is connected to it with `form="product-form"`. Errors from them are shown under the top bar.
  - The form card is on the left, and the image card beside it when the page is at least 56rem wide. Price and stock are side by side when the card is at least 28rem wide.
  - Under them come two groups, each a `<fieldset>` with a hint, two fields per row from 28rem and four from 36rem:
    - "Produktens mått och vikt (valfria)": length, width, height, diameter (cm, one decimal) and weight (g), which the product page shows. The admin fills in only what fits.
    - "Paketets vikt och mått": the packed weight and the three sides, which the checkout calculates the shipping from. They are not shown in the shop.
    - A new product starts with both groups empty.
  - Saving keeps the admin on the page, with a toast, and fetches the product again. A product that does not exist (404) says so.
  - The image card "Bilder" lists the images in order (`<ol>`): a square thumbnail, the alt text as text, "Huvudbild" (`Badge`) on the first, and per row "Flytta upp", "Flytta ner" (`IconButton`) and "Ta bort".
    - The first image's up arrow and the last one's down arrow are disabled, so the row never jumps. After a move the focus stays on the arrow (or the other one at the end of the list), and screen readers hear where the image went from a `.visually-hidden` `role="status"`.
    - In a narrow card, e.g. with large text, the thumbnail is above the text instead of beside it.
    - "Lägg till en bild" adds an image last. The file field's hint gives the file types, the size limit, the 5:6 shape and that the main image looks best on white. `InfoTip` beside the alt text field explains what an alt text is and what to write. At 10 images the form is replaced by a text that says so.
    - When a removed image's button disappears, or the form at 10 images, the focus moves to the heading "Bilder", like on the order page.
  - On "Ny produkt" the image card collects the first image without uploading it: a file needs its description, and both are shown with the form's errors. Spara creates the product, uploads the image and opens the product's own page, where more images are added.
- The order list (`/admin/ordrar`) has the tabs "Att göra" and "Alla beställningar", the search and a table. "Behöver återbetalas", "Behöver avbrytas" and "Dubbelsåld" are bold, red words under the status.
  - The search (`SearchField`, `?sok=`) is to the right of the tabs when both fit (from 40rem), and otherwise on a row of its own at full width. So it moves down before "Alla beställningar" does.
  - It looks in the order number, the customer's name and email, and the products' titles, within the chosen tab. The tabs and the pages keep it.
  - Below the field are the number of hits ("3 träffar", `aria-live`) and "Rensa sökningen", so the field keeps its width when they appear.
  - When nothing matches, the list says so, and under "Att göra" it links to the same search among every order.
- The order page (`/admin/ordrar/7`) has the cards Status (facts, link to Stripe, warning, buttons) and Kund side by side. "Visa betalningen i Stripe" opens the payment in the Stripe dashboard in a new tab, which the arrow up-right and a hidden "(öppnas i en ny flik)" tell; it is only there when the payment has a Stripe id, so not on unpaid or demo orders. The warning says what the admin has to do; for "Dubbelsåld" it is to cancel and refund the order, or ship it if they can make one more. Below them is Produkter, with the shipping (when the order has one) and the total at the bottom. After shipping or cancelling the button is gone, so the focus moves to the Status heading.
- The login page is a card in the middle of the window, with "GREJ." and the Admin badge above it and a link back to the shop below.
