# Figma Rules for Code-Ready Design – GREJ

The full rules for the skill `grej-figma`. The workflow and the core rules are in [SKILL.md](SKILL.md); read the sections here that the task touches.

## File structure and pages

Everything is in one Figma file, **GREJ – Webshop design**: the variables, text styles and components as well as the shop's and the CMS's screens.

| Page | What it holds |
|---|---|
| Foundations | Variables and text styles |
| Shop | The built shop screens |
| Admin | The built CMS screens |
| Arkiv – idéer | Ideas, planned features and old versions. Never a source for development |

- **Shop and Admin show only what is built.** A new feature starts as a copy of a frame from Arkiv – idéer, trimmed to what the sprint-plan item needs (see docs/design.md).
- **The components stay where they are.** A new component goes among the file's own components, never into a screen.
- **No new files.**
- **Name screens** `Flow / Screen / Breakpoint`, for example `Kassa / Tack / Mobile` or `Admin / Kategorier / Desktop`. Flow and screen names in Swedish, like the app's routes (`/produkter`, `/admin/kategorier`).
- **Frame widths:** 390 (phone), 768 (tablet) and 1440 px (computer). These are drawing widths, not breakpoints (see Layout).
- **Mark a section "Ready for dev"** only when it is done, and name a version in the version history at every handoff.

## Design tokens and variables

Variables are the contract between design and code. Every Figma variable has a CSS custom property with exactly the same name in `client/src/styles/_tokens.scss`, and the components only use `var(--…)`.

| Layer | Example | Value | Becomes in code |
| --- | --- | --- | --- |
| Primitive (the palette) | `charcoal` | `#2B2A27` | `--color-charcoal` |
| Token (what it is for) | `text/primary` | alias of `charcoal` | `--color-text-primary` |
| Responsive (three modes) | `font-size/display-l` | 48 / 80 / 120 | `--font-size-display-l` |

- **Never use primitives directly** in components or screens. Only the color tokens. Hide the primitives from publishing.
- **Code syntax:** set Web syntax on every variable, for example `var(--color-text-primary)`, so Dev Mode shows the real code name. The name is lowercase with hyphens.
- **Component variables are not in Figma.** A component's own variables (for example `--button-bg` in `Button`) live only in its code.
- **Scopes:** spacing only for gap and padding, border widths only for strokes, text colors only for text.
- **Modes:** the responsive collection has three modes: phone (390), tablet (768) and computer (1440). The colors have one mode, light. Dark mode is a Could in `docs/scope.md`; if it is built, it becomes a second mode on the color tokens, never recolored copies.
- **Missing a value?** Don't create a one-off variable. Use the nearest existing token and flag the deviation. A new token must be added to `_tokens.scss` too.

**Scales:**

- **Border width:** `default` 2 px, `strong` 3 px. A thin divider such as a table row line is 1 px in `border/subtle`.
- **Radius:** none. Corners are square. The only exceptions are round shapes (the dot in `StockStatus`) and small illustrations drawn in CSS (the handle of the bag in the empty cart, 18 px). A new radius needs a token in both Figma and code.
- **Shadow:** one effect style, `Shadow/Popover` (8 px down, 24 px blur, charcoal at 18 %), which becomes `--shadow-popover`.

## Typography

All text uses a text style. Each text style becomes one class in `_typography.scss`, and its font size is a responsive variable, so the class follows the phone, tablet and computer sizes by itself.

**Typefaces that exist in code** (loaded from Google Fonts in `index.html`):

- **Anton** 400, only for Display styles, always in capitals.
- **Inter** 400 (body), 500 (price), 600 (headings, labels, links) and 700 (badge).
- **Space Mono** 400, for small print (`Mono/S`).

No other typefaces or weights.

- **Name** `Group/Size`, for example `Label/M`, which becomes `.text-label-m`. A new style needs a new class too.
- **Font sizes in whole px** in Figma. The code writes them in rem (px ÷ 16), so the text follows the browser's text size.
- **Display line height stays at 116 %**, so the dots on Å, Ä and Ö don't reach the line above.
- **Line height always explicit**, never Auto. Percent becomes a unitless number: 150 % becomes `line-height: 1.5`.
- **Letter spacing in percent**, which becomes em: 8 % becomes `letter-spacing: 0.08em`.
- **Body text at least 16 px** (`Body/M`). Input fields below 16 px make iOS zoom.
- **Uppercase via Text case** in the style (becomes `text-transform`), never typed in capitals.
- **Text boxes:** paragraphs get Auto height and Fill width. Labels and button text get Auto width. Never fixed height on text.
- **Truncation via Truncate text** with a max number of lines (becomes `line-clamp` or `text-overflow: ellipsis`).
- **One style per text node.** Mix styles only for real inline semantics, like a link in a sentence.
- **Text color** always via `text/*`.
- **Vertical trim:** keep Standard, which matches CSS.

## Layout and auto layout

Auto layout is Figma's flexbox and grid. Build every frame so the developer can read display, direction, gap, padding and sizing directly.

- **Breakpoints:** phone 0–767 px, tablet 768–1023 px, computer from 1024 px. The code is mobile first: `@media (width >= 48rem)` and `@media (width >= 64rem)`. The frames are drawn at 390, 768 and 1440 px, but a tablet layout must also work at 1023 px and a computer layout at 1024 px.
- **Smallest width 320 px.** Nothing may scroll sideways at 320 px, and zooming must not break anything.
- **Page width:** the content is centered with `layout/margin` on each side and at most 1440 px wide on a computer (1344 px of content).
- **Every frame has auto layout.** Horizontal or vertical becomes flex row or column. Product grids are built with auto layout Grid: 2 columns on a phone, 3 on a tablet and a computer.
- **Sizing rules:** Hug for content-driven elements, Fill for what should grow, Fixed only for what is truly fixed (icons, the 264 px admin menu, the 288 px filter column). Never a fixed width on a container that should be flexible.
- **Gap and padding always from spacing variables.** Use Space between only when the code will use `justify-content: space-between`.
- **Wrap** for tabs and chips (becomes `flex-wrap`). Say in an annotation if a row should scroll sideways instead, like `CategoryTabs` below 1024 px.
- **Layout that follows its container:** the CMS's category pages change layout after the room beside the menu, not the screen (`@container`). Annotate such a rule with the width, for example "card to the right of the list from 56rem".
- **No spacer rectangles** or empty frames for spacing.
- **Borders:** turn on strokes included in layout. Then sizes match CSS `border` with `box-sizing: border-box`, which the whole app uses.
- **Absolute position** only for overlays inside an auto layout parent: badges, close buttons, the sold-out layer on an image.
- **Clip content** only where the code will have `overflow: hidden`.
- **Flat structure.** Every wrapper frame should map to a real HTML element.
- **Layer order = reading order** and DOM order. On narrow screens the content on top must also come first in the layer order.
- **Whole pixels.** No positions or sizes with decimals.
- **Align via auto layout**, never by nudging layers by hand.

## Components and variants

Every Figma component maps to exactly one Angular component, and its properties are named like the component's `input()`s.

| Figma property | Becomes in Angular | Example |
| --- | --- | --- |
| Variant | `input()` with fixed values | `Button`: `variant` primary, secondary, danger; `size` normal, large |
| Boolean | boolean `input()` | `disabled` |
| Text | string `input()` or the element's own text | `label` |
| Instance swap | `input()` with a name | `Icon`: `name` |
| Slot | `<ng-content />` | the button's text, the card's content |

**The components that exist** (`client/src/app/shared/`), so reuse them before you make new ones:

- `Button`: primary, secondary (2 px frame) and danger, in normal (forms and the CMS) and large (the shop's big buttons). Every variant is equally tall; the secondary's frame is taken from its padding.
- `LinkButton`: a button that looks like a link (Link/S), for actions on the same page, e.g. "Redigera" and "Ta bort" in a CMS list. `tone` default or danger.
- `Icon` and `IconButton`: an icon, and a square button with only an icon.
- `Badge`: a small label on a product image, for example "Slutsåld" and "Få kvar".
- `Pagination`, `Breadcrumb`, `QuantityStepper` (− 1 +) and `StockStatus` (dot and stock text).
- In the features: `ProductCard`, `CategoryTabs`, `ProductFilters`, `CartDrawer`, `AddedToCart`, `MobileMenu`, `AdminNav` (Figma: Admin sidebar), `AdminPageHeader` (Figma: Top bar), `AdminCategoryCard` and `AdminPropertyCard` (the form card beside a CMS list).

Rules:

- **Name a new component like its Angular class**, in PascalCase: `ProductCard`, `TextField`. Existing components with other names keep them, but their description names the code component.
- **Property names in camelCase, values in lowercase:** `size=large`. Never `Property 1 = Variant 2`.
- **Interactive states as a `state` variant:** default, hover, focus, active, disabled, plus loading if it exists. Most become CSS pseudo-classes (`:hover`, `:focus-visible`).
- **Boolean for optional parts** instead of new variants.
- **No variants for what the code computes itself.** Breakpoints are handled with the responsive modes and fill/hug, not with variants.
- **Build atomically with nested instances.** `IconButton` and the buttons in `QuantityStepper` use `Icon`.
- **Form fields are native HTML.** A text field, select or checkbox is the browser's own element styled after Figma, not a custom component, so keep them simple: a 2 px frame in `border/default` on `bg/surface`, square corners, and `feedback/error` for the frame of a field with an error.
- **Never detach instances in screens.** If a component doesn't fit, extend it with a new property and flag it.
- **Overrides only via properties.** Never change color or padding on an instance by hand.
- **Description on every component:** purpose, when to use it, the code component's name and file, and accessibility notes.
- **Slots for flexible content** (card content, dialog content) instead of many variants.

## Layer naming

Layer names describe what the element is in code, so the layer tree reads like the Angular template.

- **No default names.** `Frame 427`, `Rectangle 12` and `Group 3` are forbidden.
- **Semantic names in kebab-case, in English:** `header`, `main-nav`, `hero`, `product-card`, `card-media`, `price`, `buy-row`.
- **State the HTML element when it isn't obvious:** `nav`, `main`, `footer`, `h1`, `list`, `list-item`, `link`, `button`, `dialog`.
- **Text layers by role**, not content: `title`, `description`, `label`. Figma names text layers after their Swedish text – rename them.
- **Icon instances** are named like the icon: `icon/chevron-down`.
- **Images** get names like `image/product` or `image/hero`.
- **The same thing has the same name** on every screen.
- **Remove hidden and unused layers** before handoff.

## Icons, images and assets

GREJ has its own small icon set. Each icon is an SVG file in `client/public/icons/` and is shown by `Icon` as a CSS mask, so it takes the text color around it.

- **The icons that exist:** `close`, `plus`, `minus`, `check`, `chevron-down`, `arrow-right`, `arrow-left`, `search`. Use these before you draw a new one.
- **Icon component:** 24×24 px frame, 2 px line, vector centered, one color. The size changes in code (`--icon-size`), not with new variants.
- **A new icon** gets a kebab-case name, is exported as SVG to `client/public/icons/<name>.svg`, and its name is added to `IconName` in `shared/icons/icon.ts`. Flag it in the report.
- **Clean vectors:** no masks, no hidden layers, boolean operations flattened, one fill, so the shape works as a mask.
- **Icons are decoration.** Screen readers skip them; the button or link they are in has the text, or an `aria-label` for an `IconButton`.
- **Product photos are not exported.** They come from the admin's uploads in Supabase Storage. Use image fills with realistic photos, and Fill mode (becomes `object-fit: cover`).
- **No text in images** and no screenshots of UI as images.
- **Logos and illustrations** as SVG, with file names as in code: `logo-full.svg`.
- **Lock image frames to the code's ratio**, for example 318:380 for product images.

## Color, effects and shapes

Use only effects and shapes that have a direct CSS equivalent, and bind all of them to variables or styles.

- **Colors only via the color tokens.** No hex, and no layer opacity to fake a lighter color – use a token with alpha (`border/subtle`, `overlay/scrim`).
- **Opacity on whole elements** only for disabled states. There is no opacity token; annotate the value.
- **One shadow:** `Shadow/Popover`, for things that float over the page (the "added to cart" popup). Everything else is flat.
- **Square corners** (see Radius).
- **No gradients or blur.** The design is flat colors.
- **Blend modes:** Normal.
- **Borders:** inside stroke becomes `border`. The focus ring is an outside stroke that becomes `outline` with `outline-offset`. Avoid custom dash patterns.
- **No rotation or scaling** of UI elements, and never use the scale tool (K) – it produces odd values.
- **Check contrast** for every combination of text and background, including the dark bands (`bg/inverse`).

## States, content and responsiveness

Developers guess most where the design lacks states and edge cases. Deliver them explicitly.

| Element | States to design |
| --- | --- |
| Buttons and links | default, hover, focus-visible, active, disabled, loading |
| Form fields | empty, filled, focus, error with message, disabled |
| Lists and tables | 0 rows (empty state), 1 row, many rows, several pages (`Pagination`), loading, error |
| Screens | loading, empty, error, not found |
| Text | shortest, normal, longest, line wrap, truncation |
| Images | missing, loading, unexpected aspect ratios |
| Products | in stock, few left (1–2), sold out |

**Content and data:**

- **Swedish UI text**, realistic and in the shop's tone. Test with long Swedish compounds such as "Presentförpackning" – they break layouts.
- **Real formats:** prices like "450 kr" and "1 299 kr", dates and times like "2026-11-06 14:30" (the CMS's order list), order numbers like "Ordernummer 1042".
- **Only data the API has.** A product has a title, description, price (SEK), stock, a category (main category or subcategory), materials, colors and one image with alt text (up to 10 when several images are built). Makers, sizes, care advice, ratings and customer accounts don't exist. Don't show them on Shop or Admin; they belong on Arkiv – idéer.
- **Annotate what changes** between breakpoints, for example "the menu becomes a drawer below 1024 px".
- **Motion:** only transitions that will be built, and say what happens with reduced motion. Moving content (like the start page's band of words) stands still when reduced motion is on.

## Behaviour and motion

Figma shows exactly how a page behaves, so the code needs no guessing.

- **States are variants** with a `state` property on the component (default, hover, focus, disabled). Hover is an interactive component (While hovering → Change to, Instant), so it shows in Present. Pressing looks like hover unless the component says otherwise.
- **The focus ring** is an absolute `focus-ring` rectangle 4 px outside the element (2 px offset + 2 px stroke in `border/default`), like `:focus-visible` in `_base.scss`.
- **Click flows** are prototype links (On click → Navigate, Instant) between a page's state frames, e.g. `Admin / Material / Desktop – Redigera`. The flow starts on the page's Desktop frame.
- **Transitions are Instant** until a motion variable exists in both Figma and `_tokens.scss`. Real motion (a drawer that slides in) gets its duration, easing and what happens with reduced motion in an Interaction annotation.
- **Annotate what a prototype cannot show:** where the focus goes, confirm dialogs, URL parameters, container breakpoints, aria-labels and status messages.
- **States that only change part of a page** (loading, errors, messages) go in a `<Flow> / <Screen> / Tillstånd` frame at desktop width.
- **Sticky and fixed:** Figma can only keep layers outside a scrolling frame in place. Show a sticky header by making the content under it the scrolling frame (the only exception to Clip content), and annotate the real CSS. A layer inside a grid (e.g. a sticky card) cannot stick in Figma; annotate it.

## Accessibility

Build to WCAG 2.2 level AA from the start; designing it right is cheaper than fixing it in code. The code must pass all AXE checks.

- **Contrast:** body text at least 4.5:1. Large text (24 px, or 19 px bold) at least 3:1. Field borders, icons and the focus ring at least 3:1.
- **Visible focus** on every interactive component, as its own variant.
- **Hit targets** at least 24×24 px. Aim for 44×44 px for touch.
- **Never color alone** to convey information. `StockStatus` has a dot and text; errors have text next to the field.
- **Heading hierarchy:** annotate h1 to h6 per screen, one h1 per page.
- **Alt text:** product images get the alt text the admin writes. Annotate alt text for other informative images and mark decorative ones as decorative.
- **Forms:** visible labels (a placeholder is not a label), error messages next to the field, required fields marked.
- **Dialogs** (the cart, the menus): annotate where the focus goes when it opens and closes, and that Escape closes it.
- **Tab order:** annotate it when it doesn't follow reading order.
- **Icon buttons without text** get an annotated `aria-label` in Swedish, for example "Stäng".
- **Text scaling:** the layout must handle 200 % text size without content being clipped.

## Handoff in Dev Mode

A screen is ready for development only when it is marked Ready for dev and all behavior that isn't visible in the image is annotated.

- **Status:** mark sections Ready for dev and set Changed when something changes afterwards.
- **Annotations** for: interaction, behavior across breakpoints, validation rules and error messages, which API data a field shows, heading level, alt text, `aria-label`, focus in dialogs and animation.
- **Code syntax on the variables** so Dev Mode shows `var(--color-text-primary)` instead of hex.
- **Dev resources:** link every component to its file on GitHub (for example `client/src/app/shared/button/button.ts`).
- **Lint before handoff:** check that no values are unbound to variables.
- **Version:** name a version at every handoff and write a short changelog.
- **AI on the code side:** when the design follows these rules, Claude Code reads it via Figma's MCP server (`get_design_context`, `get_variable_defs`, `get_screenshot`) and measures the built page against it in Chrome at 320, 390, 768, 1024 and 1440 px.

## If the AI builds directly in Figma

When the AI writes to the canvas via Figma's MCP server or the plugin API, the same rules apply, plus these working steps:

1. **Read first.** Fetch existing variables, styles and components (for example `search_design_system`, `get_variable_defs`, `getLocalVariablesAsync`) before creating anything.
2. **Instantiate, don't redraw.** Use the file's components instead of building copies.
3. **Bind values to variables** (`setBoundVariable`, `setBoundVariableForPaint`). Never set raw hex or px values.
4. **Set layout explicitly** on every frame: `layoutMode`, `layoutSizingHorizontal` and `layoutSizingVertical` (FILL, HUG or FIXED), `itemSpacing` and padding.
5. **Load fonts** (`loadFontAsync`) for Anton, Inter and Space Mono before creating or changing text, and use the text styles.
6. **Name every node** as soon as it is created.
7. **Build in small steps.** One component or section at a time, take a screenshot, check against the rules, fix, move on.
8. **Missing a component or token:** create it as a real component or variable among the file's own, never locally in a screen, and flag it.
9. **Report afterwards:** which components and variables were used, what was newly created (it must also be added to the code) and where the design deviates from the rules.

## Translation table: Figma to GREJ's code

Every Figma setting below has a direct equivalent in GREJ's SCSS. Design only with settings that appear in the table.

| Figma | CSS in GREJ |
| --- | --- |
| Auto layout, horizontal | `display: flex` |
| Auto layout, vertical | `display: flex; flex-direction: column` |
| Auto layout, grid | `display: grid; grid-template-columns: …` |
| Wrap | `flex-wrap: wrap` |
| Gap `space/16` | `gap: var(--space-16)` |
| Padding | `padding: var(--space-…)` |
| Space between | `justify-content: space-between` |
| Hug contents | `width: fit-content` or auto |
| Fill, main axis | `flex: 1` |
| Fill, cross axis | `align-self: stretch` |
| Fixed 264 px | `width: 16.5rem` (px ÷ 16) |
| Min and max width | `min-width`, `max-width` in rem |
| Absolute position | `position: absolute` (parent `relative`) |
| Clip content | `overflow: hidden` |
| Inside stroke 2 px | `border: var(--border-width-default) solid var(--color-border-default)` |
| Outside stroke (focus) | `outline` and `outline-offset` |
| `Shadow/Popover` | `box-shadow: var(--shadow-popover)` |
| Image fill Fill and Fit | `object-fit: cover`, `contain` |
| Text style `Label/M` | `class="text-label-m"` on the element |
| Text case: uppercase | `text-transform: uppercase` (in the text style) |
| Truncate text | `line-clamp` or `text-overflow: ellipsis` |
| Line height 150 % | `line-height: 1.5` |
| Letter spacing 8 % | `letter-spacing: 0.08em` |
| Variable | `var(--name)` |
| Responsive mode tablet / computer | `@media (width >= 48rem)` / `@media (width >= 64rem)` |
| Component with variants | Angular component with `input()`s |
| Instance swap and slot | `input()` or `<ng-content />` |
| Icon instance | `<app-icon name="close" />` |

Sizes are px in Figma and rem in the code (1rem = 16 px), except border widths, which stay in px.

## Forbidden

Everything in this list creates work or guesswork on the code side. Never do it.

- Groups instead of frames.
- Layers with default names such as `Frame 427`.
- Hard-coded colors, spacing, borders or typefaces.
- Primitives used directly instead of color tokens.
- Detached instances and local near-copies of components.
- Spacer rectangles and empty frames for spacing.
- Fixed height on text and on containers that should grow.
- Decimal values such as 12.5 px and values outside the scale.
- Rounded corners outside the exceptions, gradients, blur and extra shadows.
- The scale tool (K) and rotation on UI elements.
- Masks where Clip content is enough, and boolean operations in layout.
- Text in images and manually typed capitals.
- Variants for breakpoints.
- Typefaces or weights other than Anton 400, Inter 400–700 and Space Mono 400.
- Icons from other libraries.
- Data the API doesn't have, on Shop or Admin.
- English UI text, hidden and leftover layers, and lorem ipsum.

## Pre-handoff checklist

Go through the list for every screen and component before it is marked Ready for dev. Report every item that isn't met.

- [ ] Every frame has auto layout, or intentional absolute position.
- [ ] No groups and no default layer names.
- [ ] All colors, spacing, borders and typefaces are bound to variables or styles from Foundations; no unbound values.
- [ ] All instances are linked to the file's components; none are detached.
- [ ] Component properties are named like the Angular component's `input()`s.
- [ ] Every screen exists at 390, 768 and 1440 px and works at 320 px, at 1023/1024 px and with long Swedish text.
- [ ] All interactive states, empty states, loading and errors are designed.
- [ ] Contrast meets WCAG 2.2 AA, also on the dark bands, focus is visible and hit targets are at least 24×24 px.
- [ ] Icons come from GREJ's icon set; new icons are flagged.
- [ ] Behavior, breakpoint rules, heading levels, alt text and dialog focus are annotated.
- [ ] Only what is built, and only data the API has.
- [ ] All UI text is in Swedish.
- [ ] No hidden or unused layers remain.
- [ ] The section is marked Ready for dev and the version is named.
- [ ] New components, tokens, text styles and icons are listed, so they can be added to the code.
