import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

// A page above the current one, e.g. { label: 'Shop', path: '/produkter' }.
export interface BreadcrumbLink {
  label: string;
  path: string;
}

// "Hem / Shop / Vas". The current page comes last and is not a link.
@Component({
  selector: 'app-breadcrumb',
  imports: [RouterLink],
  host: { class: 'text-mono-s' },
  template: `
    <nav aria-label="Brödsmulor">
      @for (link of links(); track link.path) {
        <a [routerLink]="link.path">{{ link.label }}</a>
        <span aria-hidden="true">/</span>
      }
      <span aria-current="page">{{ current() }}</span>
    </nav>
  `,
  styles: `
    // Above the title, whose Anton letters reach up over the breadcrumb and took its clicks.
    :host {
      position: relative;
      z-index: 1;
      display: block;
      color: var(--color-text-secondary);
    }

    nav {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-8);
    }

    a {
      color: inherit;
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }

    [aria-current] {
      color: var(--color-text-primary);
    }
  `,
})
export class Breadcrumb {
  readonly links = input.required<BreadcrumbLink[]>();
  readonly current = input.required<string>();
}
