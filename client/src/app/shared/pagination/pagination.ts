import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../icons/icon';

// Links to the page before and after and to the pages by number, for every paginated list
// (Figma: Pagination). Shows
// nothing when the whole list fits on one page. The page number goes in ?sida=, which each
// list page reads with toPageNumber (page-number.ts). The links keep the list's other query
// parameters, e.g. ?visa=alla in the CMS's order list, and only change sida.
// On the first and last page the missing link is shown greyed out, like the design, so the
// layout does not jump; it is a <span> then, since a link that goes nowhere confuses.
@Component({
  selector: 'app-pagination',
  imports: [RouterLink, Icon],
  template: `
    @if (totalPages() > 1) {
      <nav aria-label="Sidor">
        @if (page() > 1) {
          <a
            class="step"
            [routerLink]="path()"
            [queryParams]="{ sida: page() - 1 }"
            queryParamsHandling="merge"
          >
            <app-icon name="arrow-left" />
            <span class="step-text">Föregående</span>
          </a>
        } @else {
          <span class="step disabled" aria-hidden="true">
            <app-icon name="arrow-left" />
            <span class="step-text">Föregående</span>
          </span>
        }
        @for (list of lists(); track list.compact) {
          <ol class="pages" [class.compact]="list.compact">
            @for (item of list.pages; track $index) {
              <li>
                @if (item === 'gap') {
                  <span class="page-button gap" aria-hidden="true">…</span>
                } @else if (item === page()) {
                  <span class="page-button current" aria-current="page">
                    <span class="step-text">Sida </span>{{ item }}
                  </span>
                } @else {
                  <a
                    class="page-button"
                    [routerLink]="path()"
                    [queryParams]="{ sida: item }"
                    queryParamsHandling="merge"
                  >
                    <span class="step-text">Sida </span>{{ item }}
                  </a>
                }
              </li>
            }
          </ol>
        }
        @if (page() < totalPages()) {
          <a
            class="step"
            [routerLink]="path()"
            [queryParams]="{ sida: page() + 1 }"
            queryParamsHandling="merge"
          >
            <span class="step-text">Nästa</span>
            <app-icon name="arrow-right" />
          </a>
        } @else {
          <span class="step disabled" aria-hidden="true">
            <span class="step-text">Nästa</span>
            <app-icon name="arrow-right" />
          </span>
        }
      </nav>
    }
  `,
  styles: `
    // A 2 px line above, and the three parts spread out over the row.
    nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-4);
      margin-top: clamp(2.5rem, 2.1rem + 1.5vw, 4rem);
      padding-top: clamp(var(--space-5), 1.3rem + 0.75vw, var(--space-6));
      border-top: 2px solid var(--color-text);
    }

    // "← Föregående" and "Nästa →" as text on a computer and a tablet.
    .step {
      --icon-size: 1rem;

      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      color: var(--color-text);
      font-weight: 600;
      line-height: 1;
      text-decoration: none;
    }

    a.step:hover {
      color: var(--color-text);
      text-decoration: underline;
    }

    .disabled {
      opacity: 0.35;
    }

    .pages {
      display: flex;
      gap: var(--space-2);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    // The phone's shorter list is hidden on bigger screens, and the other way round below.
    .pages.compact {
      display: none;
    }

    // 48 px squares with a 2 px frame; the current page is filled (Figma: Page button).
    .page-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 3rem;
      height: 3rem;
      border: 2px solid var(--color-text);
      color: var(--color-text);
      font-weight: 600;
      line-height: 1;
      text-decoration: none;
    }

    a.page-button:hover {
      background: var(--color-primary-subtle);
      color: var(--color-text);
    }

    .current {
      background: var(--color-primary);
      color: var(--color-on-primary);
    }

    .gap {
      border-color: transparent;
    }

    // "Sida" before the number is only for screen readers, which would otherwise read a
    // lonely number. Hidden on the screen, but still read.
    .page-button .step-text {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }

    // On a phone only the arrows, in 44 px squares, and 40 px page squares, like the design's
    // compact version.
    @media (width < 48rem) {
      .pages {
        display: none;
        gap: 0.375rem;
      }

      .pages.compact {
        display: flex;
      }

      .page-button {
        width: 2.5rem;
        height: 2.5rem;
        font-size: 0.9375rem;
      }

      .step {
        --icon-size: 1.125rem;

        justify-content: center;
        width: 2.75rem;
        height: 2.75rem;
        border: 2px solid var(--color-text);
      }

      a.step:hover {
        background: var(--color-primary-subtle);
      }

      // Hidden on the screen, but still read by screen readers, so the link has a name.
      .step-text {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }
    }
  `,
})
export class Pagination {
  // The list's URL, e.g. '/produkter'.
  readonly path = input.required<string>();
  readonly page = input.required<number>();
  readonly totalPages = input.required<number>();

  // The page numbers on a computer and a tablet, e.g. 1 … 4 5 6 … 8 on page 5, and the
  // shorter list for a phone, e.g. 1 … 5 … 8, which fits on 390 px. The template shows both
  // and the styles hide one.
  protected readonly lists = computed(() => [
    { compact: false, pages: pageNumbers(this.page(), this.totalPages(), 1) },
    { compact: true, pages: pageNumbers(this.page(), this.totalPages(), 0) },
  ]);
}

// The page numbers to show, with 'gap' where pages are left out: always the first and the
// last page, the current one with `near` pages on each side, and the first or last three when
// the current page is near an end, e.g. 1 2 3 … 8 on page 1, like the design.
function pageNumbers(page: number, total: number, near: number): (number | 'gap')[] {
  const shown = new Set([1, total]);
  for (let n = page - near; n <= page + near; n++) {
    shown.add(n);
  }
  if (page <= 3) {
    [2, 3].forEach((n) => shown.add(n));
  }
  if (page >= total - 2) {
    [total - 1, total - 2].forEach((n) => shown.add(n));
  }
  const numbers = [...shown].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);

  const result: (number | 'gap')[] = [];
  numbers.forEach((n, i) => {
    if (i > 0 && n - numbers[i - 1] > 1) {
      result.push('gap');
    }
    result.push(n);
  });
  return result;
}
