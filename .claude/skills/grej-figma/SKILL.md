---
name: grej-figma
description: Rules and workflow for GREJ's design in the Figma file GREJ – Webshop design and for building it in Angular. Use for any Figma work, when building or restyling a page from a Figma frame, and when updating Figma after the code.
argument-hint: "[page]: [already built | new feature] – [what]"
---

# GREJ – Figma and design

Task: $ARGUMENTS

Work on one page at a time. Before you start, read:
- `docs/design.md` – the Figma pages and each page's status
- the current item in `docs/sprint-plan.md`, for a new feature
- the sections of [reference.md](reference.md) that the task touches
- in Figma: the variables, text styles and components (`search_design_system`, `get_variable_defs`)

Then tell me in a few lines what you will do and which parts of the frame you will leave out, and wait for my OK.

## Workflow

**A page that is already built (code → Figma).** The code is the truth.
1. Update the page's frames on Shop or Admin so they show exactly what the code shows, at 390, 768 and 1440 px, with the file's components and variables.
2. Compare Figma with the running page in Chrome at 320, 390, 768, 1024 and 1440 px. Report the differences; change the code only for bugs I confirm.
3. Set the page's status in `docs/design.md` to Synced.

**A new feature (Figma → code).**
1. Start from the frame I copied from Arkiv – idéer. Trim it to what the sprint-plan item needs and the API has data for.
2. Build it in the code, the way CLAUDE.md describes.
3. If the code has to differ from the frame, update the frame in the same session. Never write the difference down instead.
4. Set the page's status in `docs/design.md`.

**When a page is done:** remove its old "differs from Figma" notes in the docs, and the Figma sizes and "like in Figma" comments in its code files.

## Core rules

1. Everything is auto layout. No groups and no freely placed layers. Absolute position only for intentional overlays (badge, close button).
2. No hard-coded values. Every color, spacing, border width, font size and shadow is bound to a variable or style. Whole px only, and only values on the scale.
3. Names are the code's names. A variable's Web code syntax is its name in `_tokens.scss`. Text style Display/L is the class `.text-display-l`. Components are named like the Angular components.
4. One Figma component = one Angular component. Variants and properties = `input()`s. Never detach instances.
5. Reuse before you create. Search the file's components, variables and styles first.
6. Only what standard CSS can do. Square corners, a 2 px border, and no effects without a clean CSS equivalent.
7. Responsive from the start. Fill, hug and min/max instead of fixed widths. Frames at 390, 768 and 1440 px; the code switches at 768 and 1024 px. Everything works at 320 px and at 200 % zoom.
8. All states: default, hover, focus-visible, active, disabled, loading, error and empty.
9. Accessible: WCAG 2.2 AA contrast, visible focus, hit targets at least 24×24 px.
10. Real Swedish content: Swedish UI text, prices like "1 299 kr", long Swedish words. No lorem ipsum.
11. Only what is built. Shop and Admin show only what the code has and the API has data for. Ideas stay on Arkiv – idéer.
12. A primitive (`--color-oat`, `--color-graphite` …) is never used in a component, only the color tokens.

## Never

- Change anything in Figma outside the page we are working on.
- Build from Arkiv – idéer unless I copied the frame.
- Add a variable, text style, component or icon only in Figma or only in the code. Always both, with the same name.

## Before you finish

Run the checklist at the end of [reference.md](reference.md) and report:
- what you changed in Figma and in the code
- new components, variables, text styles and icons
- anything in the checklist that is not met
- a few lines for docs/ai-log.md
