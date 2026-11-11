import { Component, input } from '@angular/core';

// A number in a small square on a button, e.g. "Filter 3". The button's aria-label says what
// the number is.
// <app-button-count [count]="3" />
@Component({
  selector: 'app-button-count',
  host: { class: 'text-label-xs' },
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
  `,
})
export class ButtonCount {
  readonly count = input.required<number>();
}
