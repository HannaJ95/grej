---
name: grej-ui
description: How GREJ's UI is built in the Angular code – design system, responsive layout, WCAG 2.2 AA, states and how to check the result. Use for every change to how a page or component in client/ looks or behaves, from a new page to a small tweak or a screenshot of what I want.
argument-hint: "[page or component]: [what to change]"
---

# GREJ – UI in the code

Task: $ARGUMENTS

The code is the design. The tokens, text classes and shared components in `client/` are the design system, and `docs/design.md` describes how each page looks and behaves. There is no design file to follow.

I am still learning frontend, so act as an expert frontend developer and designer. Make the professional call yourself from the rules below, and tell me in a line or two which choices you made. Ask me only when a choice changes something I would notice (a new layout, new text, removing something) or when the rules don't cover it.

## Before you change anything

- Read the files you will change, the page's section in `docs/design.md`, and the shared components you could reuse.
- **Screenshots from me.** Say in one line what you see and what you will change. A screenshot shows one width and one state; work out the other widths and states with the rules below. If it shows another site, take the idea (layout, hierarchy, spacing rhythm), never its colors, fonts or exact values. Translate it into GREJ's tokens.
- **Size of the change.** A small change (one thing on one page) is made directly. A new page, a new component or a layout change across screen sizes starts with a short plan, and waits for my OK.

## Design system: reuse before you create

- **Colors** only through the color tokens in `client/src/styles/_tokens.scss` (`--color-bg-*`, `--color-text-*`, `--color-border-*`, `--color-icon-*`, `--color-feedback-*`, `--color-overlay-scrim`). Never the primitives (`--color-oat`, `--color-charcoal` …), hex or rgb in a component. Hover: dark surfaces `--color-bg-inverse-hover`, light ones `--color-bg-hover`.
- **Spacing** only `--space-*`, borders `--border-width-*`, the one shadow `--shadow-popover`. Sizes in rem (px ÷ 16), border widths in px.
- **Missing value:** use the nearest token. Add a new token to `_tokens.scss` only when it is really needed, and tell me.
- **Text** always through a class from `client/src/styles/_typography.scss` on the element (`class="text-label-m"`), never font-size or weight by hand. Anton is only for the Display styles, Inter for text, Space Mono for small print. Capitals come from the class, never typed. Body text and form fields are at least 16 px (smaller fields make iOS zoom).
- **The look:** flat colors, square corners (radius only for round shapes such as the stock dot), 2 px borders (3 px for strong, 1 px `--color-border-subtle` for row lines), no gradients, blur or other shadows. Links are underlined.
- **Shared components** in `client/src/app/shared/`:
  - `Button`, an attribute on a real `<button>` or `<a>`: `variant` primary, secondary, danger; `size` normal (forms, CMS) or large (the shop's big buttons)
  - `LinkButton` (`appLinkButton`): an action on the same page that looks like a link, e.g. "Redigera"; `tone` default or danger
  - `IconButton`: a square button with only an icon; `tone` dark or light; always an `aria-label` in Swedish
  - `Icon`: the icons in `IconName` (`shared/icons/icon.ts`). A new icon is a 24×24 SVG with a 2 px line in `client/public/icons/` plus its name in `IconName`
  - `Badge`, `Breadcrumb`, `Pagination`, `QuantityStepper`, `SearchField`, `StockStatus`
  - The feature components (`ProductCard`, `AdminPageHeader`, the CMS cards …) are in `docs/design.md`.
- A look that is needed in two places becomes a shared component or a shared scss file, like `admin-page.scss`. It is never copied.
- **New admin pages** reuse the existing admin pattern: `AdminPageHeader` at the top, and the list with a card beside it where the page edits rows.

## Layout and responsive

- **Phone first.** Base styles for the phone, then `@media (width >= 48rem)` for a tablet and `@media (width >= 64rem)` for a computer. Breakpoints: phone 0–767, tablet 768–1023, computer from 1024 px.
- **Layout that depends on its own room** (a card beside a list, content beside the admin menu) uses container queries (`container-type: inline-size` and `@container`), not the screen width.
- **Must work** from 320 px without sideways scroll, at both 1023 and 1024 px, and at 200 % zoom and text size, without clipped or overlapping text.
- **Flexible sizes:** flex or grid with `gap`, and `min-width` and `max-width` in rem. Fixed widths only for what is really fixed (icons, the 264 px admin menu, the 288 px filter column). Never a fixed height on text or on anything that holds text.
- **Long Swedish words** ("Presentförpackning"): `min-width: 0` or `minmax(0, 1fr)` in flex and grid, and `overflow-wrap: anywhere` on headings that can overflow.
- **Page width:** shop content uses `.page-width`; admin content uses `--layout-admin-gutter`.
- **Order:** the HTML order is the visual order and the tab order. On a narrow screen, what is on top comes first in the HTML. Don't move things with `order` or grid placement in a way that breaks this.
- **Sticky** elements stop sticking when the window is lower than 30rem (zoomed in), and `scroll-padding-*` in `_base.scss` keeps a focused element from hiding behind them.
- **Touch:** nothing may only work on hover. What appears on hover also appears on keyboard focus, and has a way to work on touch.

## States

- **Interactive elements:** default, hover, focus-visible, active and disabled.
- **Data:** loading, empty, error, not found, one item, many items, several pages (`Pagination`).
- **Products:** in stock, few left (1–2) and sold out.
- **Forms:** a visible label, required fields marked, an error text next to the field (`aria-invalid` and `aria-describedby`), focus to the first error (`shared/first-error.ts`), and a success message in an element with `role="status"`.
- **Motion:** only short transitions, and `@media (prefers-reduced-motion: reduce)` turns them off. Moving content stands still.

## Accessibility: WCAG 2.2 AA, must pass axe

- **HTML first:** `<button>` for actions, `<a>` for navigation, `<nav>`, `<main>`, lists, `<table>` for tables, native form fields (styled, never replaced), `<dialog>` for drawers and popups, `<details>` for content that folds. ARIA only where HTML has nothing.
- **Headings:** one h1 per page, levels in order. The text class sets the size, not the heading level.
- **Contrast:** text at least 4.5:1 (large text 3:1); borders, icons and the focus ring at least 3:1. Check every new combination of text and background, and give me the ratio.
- **Focus:** the ring in `_base.scss` (`:focus-visible`). On dark backgrounds set `outline-color: var(--color-border-inverse)`. Never remove the outline without a replacement.
- **Hit targets** at least 24×24 px, aim for 44×44 px on touch.
- **Never color alone.** Icons are `aria-hidden`; their button has text or an `aria-label`.
- **Dialogs:** focus moves into them when they open and back to their button when they close, and Escape closes them. Toggles have `aria-expanded` or `aria-pressed`, and the current link has `aria-current`.
- **Images:** product images use the admin's alt text, and decorative images `alt=""`.
- **Messages** that appear by themselves use `aria-live` or `role="status"` and never take the focus.
- Angular removes the spaces between tags, so put a space inside a `<span>` when a screen reader must read two parts apart ("Keramik 8").

## Content

- All UI text in Swedish, in the shop's tone. Formats: "1 299 kr", "2026-11-06 14:30", "Ordernummer 1042".
- Only data the API has. Never fake makers, ratings, sizes or other data that doesn't exist.

## Code

- Follow `client/CLAUDE.md`. Styles go in the component's scss (or host styles in a shared component); global styles only in `client/src/styles/`.
- Comments are short whys. No px values from a screenshot, no "like in the picture" and no tutorials. Clean the comments in every file you touch.
- When a page's look or behaviour changes, update its section in `docs/design.md` (what it does, not px values).

## Check before you say it is done

1. Run `npm run build` and the affected specs in `client/`.
2. Look at the page in Chrome on http://localhost:4200, my own dev server. If it doesn't answer, ask me to start the client (`npm start`) and the API. Check 320, 390, 768, 1023, 1024 and 1440 px. The Chrome window can't be narrower than 500 px, so measure in a same-origin iframe of the right width with `javascript_tool`. At each width:
   - no sideways scroll (`scrollWidth` no wider than the viewport)
   - nothing clipped or overlapping
   - hover and focus states
   - Tab through the page: the order is logical and the focus is always visible
   - once at 200 % zoom
3. For a new page or a big change, run axe-core in the page and fix what it finds.
4. Report in a few lines:
   - what changed
   - which choices you made yourself
   - anything that didn't pass
   - a commit message
