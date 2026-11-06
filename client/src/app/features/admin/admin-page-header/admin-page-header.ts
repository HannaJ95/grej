import { Component, input } from '@angular/core';

// The top of an admin page (Figma: Top bar): a small label above the page's h1, and room to
// the right for the page's button, e.g.
// <app-admin-page-header eyebrow="Kategorier" title="Huvudkategorier"><button …></app-admin-page-header>.
@Component({
  selector: 'app-admin-page-header',
  template: `
    <div class="title">
      <p class="eyebrow text-mono-s">{{ eyebrow() }}</p>
      <h1 class="text-display-xs">{{ title() }}</h1>
    </div>
    <ng-content />
  `,
  styles: `
    // The line under it reaches the edges of the main area, so it takes back the padding that
    // AdminLayout gives <main> (24 px above, --admin-gutter on the sides).
    :host {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-24);
      margin: calc(-1 * var(--space-24)) calc(-1 * var(--admin-gutter)) var(--space-32);
      padding: var(--space-24) var(--admin-gutter);
      border-bottom: var(--border-width-default) solid var(--color-border-default);
    }

    .title {
      display: flex;
      flex-direction: column;
      gap: var(--space-6);
    }

    // Written normally in the template and shown in capitals, so screen readers read a word.
    .eyebrow {
      margin: 0;
      color: var(--color-text-secondary);
      text-transform: uppercase;
    }

    h1 {
      margin: 0;
    }
  `,
})
export class AdminPageHeader {
  readonly eyebrow = input.required<string>();
  readonly title = input.required<string>();
}
