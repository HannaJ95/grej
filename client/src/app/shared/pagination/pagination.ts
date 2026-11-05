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
            class="step text-label-m"
            [routerLink]="path()"
            [queryParams]="{ sida: page() - 1 }"
            queryParamsHandling="merge"
          >
            <app-icon name="arrow-left" />
            <span class="step-text">Föregående</span>
          </a>
        } @else {
          <span class="step disabled text-label-m" aria-hidden="true">
            <app-icon name="arrow-left" />
            <span class="step-text">Föregående</span>
          </span>
        }
        @for (list of lists(); track list.compact) {
          <ol
            class="pages"
            [class.compact]="list.compact"
            [class.text-label-m]="!list.compact"
            [class.text-label-s]="list.compact"
          >
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
            class="step text-label-m"
            [routerLink]="path()"
            [queryParams]="{ sida: page() + 1 }"
            queryParamsHandling="merge"
          >
            <span class="step-text">Nästa</span>
            <app-icon name="arrow-right" />
          </a>
        } @else {
          <span class="step disabled text-label-m" aria-hidden="true">
            <span class="step-text">Nästa</span>
            <app-icon name="arrow-right" />
          </span>
        }
      </nav>
    }
  `,
  styles: `
    // A 2 px line above, and the three parts spread out over the row. The space above is the
    // space above the pagination on Figma's shop page: 40 px on a phone, 56 px on a tablet and
    // 64 px on a computer. The styles are written for a phone first, and the media queries at
    // the bottom change them on bigger screens.
    nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-12);
      margin-top: var(--space-40);
      padding-top: var(--space-24);
      border-top: var(--border-width-default) solid var(--color-border-default);
    }

    // On a phone "Föregående" and "Nästa" are 44 px squares with only the arrow, like
    // Figma's compact Pagination.
    .step {
      --icon-size: 1.125rem;

      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-8);
      width: 2.75rem;
      height: 2.75rem;
      border: var(--border-width-default) solid var(--color-border-default);
      color: var(--color-text-primary);
      text-decoration: none;
    }

    a.step:hover {
      background: var(--color-oat);
    }

    // Figma shows the missing link with 35 % opacity.
    .disabled {
      opacity: 0.35;
    }

    // The words are hidden on the screen on a phone, but still read by screen readers, so
    // the link has a name. "Sida" before a number is always hidden the same way, since a
    // screen reader would otherwise read a lonely number.
    .step-text {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }

    // The phone shows the shorter list (compact) and hides the other one.
    .pages {
      display: none;
      gap: var(--space-6);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .pages.compact {
      display: flex;
    }

    // 40 px squares with a 2 px frame on a phone; the current page is filled (Figma: Page
    // button).
    .page-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.5rem;
      height: 2.5rem;
      border: var(--border-width-default) solid var(--color-border-default);
      color: var(--color-text-primary);
      text-decoration: none;
    }

    a.page-button:hover {
      background: var(--color-oat);
    }

    .current {
      background: var(--color-bg-inverse);
      color: var(--color-text-on-inverse);
    }

    .gap {
      border-color: transparent;
    }

    // Tablet and computer: Figma's wide Pagination. "← Föregående" and "Nästa →" as text, the
    // longer list of pages, and 48 px squares.
    @media (width >= 48rem) {
      nav {
        margin-top: var(--space-56);
        padding-top: var(--space-32);
      }

      .step {
        --icon-size: 1rem;

        width: auto;
        height: auto;
        border: none;
      }

      a.step:hover {
        background: none;
        text-decoration: underline;
      }

      .step > .step-text {
        position: static;
        width: auto;
        height: auto;
        overflow: visible;
        clip-path: none;
      }

      .pages {
        display: flex;
        gap: var(--space-8);
      }

      .pages.compact {
        display: none;
      }

      .page-button {
        width: 3rem;
        height: 3rem;
      }
    }

    @media (width >= 64rem) {
      nav {
        margin-top: var(--space-64);
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
