import { Component, input } from '@angular/core';

// A small label on a product image, e.g. <app-badge tone="light">Slutsåld</app-badge>
// (Figma: Badge). The text is written normally and shown in capitals, so screen readers read
// a word instead of letters (the text style Badge has the capitals).
@Component({
  selector: 'app-badge',
  host: {
    class: 'text-badge',
    '[class.light]': "tone() === 'light'",
  },
  template: '<ng-content />',
  styles: `
    :host {
      display: inline-block;
      padding: var(--space-6) var(--space-12);
      background: var(--color-bg-inverse);
      color: var(--color-text-on-inverse);
      white-space: nowrap;
    }

    // Only the light badge has a frame in Figma, so it is 4 px taller than the dark one.
    :host(.light) {
      border: var(--border-width-default) solid var(--color-border-default);
      background: var(--color-bg-surface);
      color: var(--color-text-primary);
    }
  `,
})
export class Badge {
  readonly tone = input<'dark' | 'light'>('dark');
}
