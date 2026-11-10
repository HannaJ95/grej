import { Component, input } from '@angular/core';
import { Icon } from '../icons/icon';

let nextId = 0;

// A small (i) button that opens a box of help text on click, tap or Enter, not on hover, which
// touch screens and keyboards don't have. The box is a native popover, so the browser closes it on
// Escape or a click outside and shows it above everything else.
// <app-info-tip label="Vad är alt-text?"><p>…</p></app-info-tip>
@Component({
  selector: 'app-info-tip',
  imports: [Icon],
  template: `
    <button
      type="button"
      class="trigger"
      [attr.popovertarget]="id"
      [attr.aria-label]="label()"
      [style.anchor-name]="anchor"
    >
      <app-icon name="info" />
    </button>
    <div class="tip text-body-s" popover [id]="id" [style.position-anchor]="anchor">
      <ng-content />
    </div>
  `,
  styles: `
    :host {
      display: inline-flex;
    }

    // The smallest hit target allowed, so the row it sits in barely grows.
    .trigger {
      --icon-size: 1.125rem;

      display: grid;
      place-items: center;
      width: 1.5rem;
      height: 1.5rem;
      margin-block: calc(var(--space-4) * -1);
      padding: 0;
      border: none;
      background: none;
      color: var(--color-text-secondary);
      cursor: pointer;

      &:hover {
        color: var(--color-text-primary);
      }
    }

    // On a phone the browser shows the box in the middle of the window, where it always fits. A
    // phone is too narrow for it beside the button, which sits in the middle of a line.
    .tip {
      width: min(20rem, calc(100vw - 2 * var(--space-16)));
      // Scrolls inside when large text makes it taller than the window.
      max-height: calc(100vh - 2 * var(--space-16));
      overflow-y: auto;
      padding: var(--space-16);
      border: var(--border-width-default) solid var(--color-border-default);
      background: var(--color-bg-surface);
      color: var(--color-text-primary);
      box-shadow: var(--shadow-popover);

      // Only when open, since a popover's display decides whether it is shown at all.
      &:popover-open {
        display: flex;
        flex-direction: column;
        gap: var(--space-8);
      }

      @media (width >= 48rem) {
        @supports (position-area: block-end) {
          inset: auto;
          margin: var(--space-8) 0;
          position-area: block-end span-inline-end;
          // Below and to the right first, else the first of these that fits in the window. Last
          // the middle of the window, as on a phone, e.g. when large text makes the box too big.
          position-try-fallbacks:
            flip-inline,
            flip-block,
            flip-block flip-inline,
            --info-tip-middle;
        }
      }
    }

    // Passed on as it is by Angular, which only scopes rules with selectors.
    @position-try --info-tip-middle {
      position-area: none;
      inset: 0;
      margin: auto;
    }
  `,
})
export class InfoTip {
  // Says what the box explains, since the button only has an icon.
  readonly label = input.required<string>();

  // Unique, since a page can have several, like FilterGroup's ids.
  protected readonly id = `info-tip-${nextId++}`;
  protected readonly anchor = `--${this.id}`;
}
