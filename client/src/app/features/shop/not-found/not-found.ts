import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from '../../../shared/button/button';
import { Icon } from '../../../shared/icons/icon';

// What the shop shows when something isn't there: an unknown address or a missing product.
// <app-not-found heading="Sidan finns inte">Adressen kan vara fel …</app-not-found>
@Component({
  selector: 'app-not-found',
  imports: [RouterLink, Button, Icon],
  template: `
    <div class="hero">
      <h1 class="text-display-hero">{{ heading() }}</h1>
      <p class="intro text-body-l"><ng-content /></p>
      <div class="actions">
        <a appButton size="large" routerLink="/produkter">
          Visa alla grejer
          <app-icon name="arrow-right" />
        </a>
        <a class="text-link-l" routerLink="/">Till startsidan</a>
      </div>
    </div>
  `,
  styleUrls: ['../text-page.scss', '../page-hero.scss'],
  styles: `
    :host {
      display: block;
    }

    // Long words break instead of widening the page.
    h1,
    p {
      margin: 0;
      overflow-wrap: anywhere;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-16) var(--space-24);
    }
  `,
})
export class NotFound {
  readonly heading = input.required<string>();
}
