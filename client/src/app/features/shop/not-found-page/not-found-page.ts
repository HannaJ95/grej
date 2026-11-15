import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from '../../../shared/button/button';
import { Icon } from '../../../shared/icons/icon';

// Every address the routes don't know, so a wrong link never gives a blank page.
@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink, Button, Icon],
  template: `
    <div class="hero">
      <h1 class="text-display-hero">Sidan finns inte</h1>
      <p class="intro text-body-l">
        Adressen kan vara fel, eller så har sidan flyttats. Grejerna finns kvar i butiken.
      </p>
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
  host: { class: 'page-width' },
})
export class NotFoundPage {}
