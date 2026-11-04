import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../icons/icon';

// Links to the page before and after, for every paginated list (Figma: Pagination). Shows
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
        <span class="current">Sida {{ page() }} av {{ totalPages() }}</span>
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

    .current {
      font-weight: 600;
    }

    // On a phone only the arrows, in 44 px squares, like the design's compact version.
    @media (width < 48rem) {
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
}
