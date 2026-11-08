import { Component, input } from '@angular/core';

// <app-badge tone="light">Slutsåld</app-badge>. Write the text in normal case: the text style
// shows capitals, so screen readers read a word instead of letters.
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
