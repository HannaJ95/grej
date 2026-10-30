import { Component, input } from '@angular/core';

// The app's button, in three variants. It is an attribute on a real <button> or <a>, e.g.
// <button appButton variant="danger">, so the element keeps everything the browser gives it:
// the keyboard, submitting a form, disabled, and links with routerLink. The same idea as
// Angular Material's matButton.
@Component({
  selector: 'button[appButton], a[appButton]',
  host: {
    // The variant becomes a class on the element, which the styles below look for.
    '[class.secondary]': "variant() === 'secondary'",
    '[class.danger]': "variant() === 'danger'",
  },
  // The element's own content, e.g. "Spara", is shown where <ng-content /> is.
  template: '<ng-content />',
  styles: `
    // A variant only changes these variables, so one hover rule works for every variant.
    :host {
      --button-bg: var(--color-primary);
      --button-bg-hover: var(--color-primary-hover);
      --button-border: transparent;
      --button-text: var(--color-on-primary);

      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-4);
      border: 1px solid var(--button-border);
      border-radius: var(--radius);
      background: var(--button-bg);
      color: var(--button-text);
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
    }

    // The color is set again, since a:hover in _base.scss would change a link's text.
    :host(:hover:not(:disabled)) {
      background: var(--button-bg-hover);
      color: var(--button-text);
    }

    :host(.secondary) {
      --button-bg: var(--color-surface);
      --button-bg-hover: var(--color-primary-subtle);
      --button-border: var(--color-primary);
      --button-text: var(--color-primary);
    }

    :host(.danger) {
      --button-bg: var(--color-danger);
      --button-bg-hover: var(--color-danger-hover);
      --button-text: var(--color-on-danger);
    }

    :host(:disabled) {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `,
})
export class Button {
  readonly variant = input<'primary' | 'secondary' | 'danger'>('primary');
}
