import { Component, input } from '@angular/core';

// <app-admin-page-header eyebrow="Kategorier" title="Huvudkategorier">
//   <button appButton>…</button>
// </app-admin-page-header>
@Component({
  selector: 'app-admin-page-header',
  template: `
    <div class="title">
      <p class="eyebrow text-mono-s-caps">{{ eyebrow() }}</p>
      <h1 class="text-display-xs">{{ title() }}</h1>
    </div>
    <ng-content />
  `,
  styles: `
    // The negative margins cancel the padding on <main>, so the border spans its full width.
    :host {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-24);
      margin: calc(-1 * var(--space-24)) calc(-1 * var(--layout-admin-gutter)) var(--space-32);
      padding: var(--space-24) var(--layout-admin-gutter);
      border-bottom: var(--border-width-default) solid var(--color-border-default);
    }

    .title {
      display: flex;
      flex-direction: column;
      gap: var(--space-6);
    }

    .eyebrow {
      margin: 0;
      color: var(--color-text-secondary);
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
