import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../icons/icon';

// Page links in ?sida= (read with toPageNumber). A missing previous or next link is a greyed-out
// <span>, so the layout doesn't jump and no link goes nowhere.
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
            [fragment]="fragment()"
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
                    [fragment]="fragment()"
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
            [fragment]="fragment()"
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
    // Wraps with large text: the arrows get rows of their own above and below the numbers.
    nav {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-8);
      margin-top: var(--space-40);
      padding-top: var(--space-24);
      border-top: var(--border-width-default) solid var(--color-border-default);
    }

    // Only the arrow on a phone.
    .step {
      --icon-size: 1.125rem;

      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-8);
      width: 2.5rem;
      height: 2.5rem;
      border: var(--border-width-default) solid var(--color-border-default);
      color: var(--color-text-primary);
      text-decoration: none;
    }

    a.step:hover {
      background: var(--color-bg-hover);
    }

    .disabled {
      opacity: 0.35;
    }

    // Visually hidden but read by screen readers, so the arrow links have a name and a number
    // is read as "Sida 3".
    .step-text {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }

    // Keeps "Nästa" at the right edge also when it is alone on its row.
    .step:last-child {
      margin-inline-start: auto;
    }

    // Fills the room between the arrows; the auto basis lets the row break before the list when
    // the numbers don't fit, so the list gets the whole width and wraps.
    .pages {
      display: none;
      flex: 1 1 auto;
      flex-wrap: wrap;
      justify-content: center;
      gap: var(--space-4);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .pages.compact {
      display: flex;
    }

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
      background: var(--color-bg-hover);
    }

    .current {
      background: var(--color-bg-inverse);
      color: var(--color-text-on-inverse);
    }

    // Narrower than a page button, so "1 … 5 … 9" fits on a 320 px phone.
    .page-button.gap {
      width: auto;
      border-color: transparent;
    }

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
  readonly path = input.required<string>();
  readonly page = input.required<number>();
  readonly totalPages = input.required<number>();
  // An id on the list's page where a new page starts, instead of at the top.
  readonly fragment = input<string>();

  // The full list (1 … 4 5 6 … 8) and a compact one for phones (1 … 5 … 8). Both are rendered
  // and the styles show one.
  protected readonly lists = computed(() => [
    { compact: false, pages: pageNumbers(this.page(), this.totalPages(), 1) },
    { compact: true, pages: pageNumbers(this.page(), this.totalPages(), 0) },
  ]);
}

// The first and last page, `near` pages on each side of the current one, and the first or last
// three near an end (1 2 3 … 8), with 'gap' where pages are left out.
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
