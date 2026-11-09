import { Component, input } from '@angular/core';

// A number in a small square on a button, e.g. "Filter 3" and "Varukorg 2". The button's
// aria-label says what the number is.
// <app-button-count [count]="3" tone="light" />
@Component({
  selector: 'app-button-count',
  host: {
    class: 'text-label-xs',
    '[class.light]': "tone() === 'light'",
  },
  template: '{{ count() }}',
  styles: `
    // min-width and min-height let the square grow with the text. The negative margin makes it
    // take no more height than its own text, so the button stays as tall as without it.
    :host {
      display: inline-grid;
      place-items: center;
      min-width: 1.25rem;
      min-height: 1.25rem;
      margin-block: calc((1em - 1.25rem) / 2);
      padding-inline: var(--space-4);
      background: var(--color-bg-inverse);
      color: var(--color-text-on-inverse);
    }

    :host(.light) {
      background: var(--color-bg-surface);
      color: var(--color-text-primary);
    }
  `,
})
export class ButtonCount {
  readonly count = input.required<number>();
  // Dark on a light button, light on a dark one.
  readonly tone = input<'dark' | 'light'>('dark');
}
