import { Component, input } from '@angular/core';

// A small label on a product image, e.g. <app-badge tone="light">Slutsåld</app-badge>
// (Figma: Badge). The text is written normally and shown in capitals, so screen readers read
// a word instead of letters.
@Component({
  selector: 'app-badge',
  host: {
    '[class.light]': "tone() === 'light'",
  },
  template: '<ng-content />',
  styles: `
    :host {
      display: inline-block;
      padding: 0.4375rem var(--space-3);
      border: 2px solid var(--color-primary);
      background: var(--color-primary);
      color: var(--color-surface);
      font-size: 0.75rem;
      font-weight: 700;
      line-height: 1;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      white-space: nowrap;
    }

    :host(.light) {
      background: var(--color-surface);
      color: var(--color-text);
    }
  `,
})
export class Badge {
  readonly tone = input<'dark' | 'light'>('dark');
}
