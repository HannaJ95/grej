import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from '../button/button';

// Links to the page before and after, for every paginated list. Shows nothing when the whole
// list fits on one page. The page number goes in ?sida=, which each list page reads with
// toPageNumber (page-number.ts).
@Component({
  selector: 'app-pagination',
  imports: [RouterLink, Button],
  template: `
    @if (totalPages() > 1) {
      <nav aria-label="Sidor">
        @if (page() > 1) {
          <a
            appButton
            variant="secondary"
            [routerLink]="path()"
            [queryParams]="{ sida: page() - 1 }"
          >
            Föregående
          </a>
        }
        <span>Sida {{ page() }} av {{ totalPages() }}</span>
        @if (page() < totalPages()) {
          <a
            appButton
            variant="secondary"
            [routerLink]="path()"
            [queryParams]="{ sida: page() + 1 }"
          >
            Nästa
          </a>
        }
      </nav>
    }
  `,
  styles: `
    nav {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-4);
      margin-top: var(--space-6);
    }
  `,
})
export class Pagination {
  // The list's URL, e.g. '/produkter'.
  readonly path = input.required<string>();
  readonly page = input.required<number>();
  readonly totalPages = input.required<number>();
}
