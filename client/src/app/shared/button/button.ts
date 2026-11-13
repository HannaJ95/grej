import { Component, input } from '@angular/core';

// An attribute on a real <button> or <a>, so the element keeps its keyboard handling, form
// submit, disabled and routerLink: <button appButton variant="danger">.
@Component({
  selector: 'button[appButton], a[appButton]',
  host: {
    '[class.secondary]': "variant() === 'secondary'",
    '[class.danger]': "variant() === 'danger'",
    '[class.large]': "size() === 'large'",
    '[class.text-label-l]': "size() === 'large'",
    '[class.text-label-m]': "size() === 'normal'",
  },
  template: '<ng-content />',
  styles: `
    // The variants only override these, so one hover rule covers all of them.
    :host {
      --button-bg: var(--color-bg-inverse);
      --button-bg-hover: var(--color-bg-inverse-hover);
      --button-text: var(--color-text-on-inverse);
      // Subtracted from the padding, so every variant is equally tall.
      --button-border: 0px;
      // An icon beside the label follows the label's size.
      --icon-size: 1.25em;

      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-8);
      max-width: 100%;
      padding: calc(var(--space-8) - var(--button-border))
        calc(var(--space-16) - var(--button-border));
      border: var(--button-border) solid var(--color-border-default);
      background: var(--button-bg);
      color: var(--button-text);
      text-align: center;
      // With large text a label ("Ny huvudkategori") can be wider than a phone.
      overflow-wrap: anywhere;
      cursor: pointer;
    }

    :host(:hover:not(:disabled)) {
      background: var(--button-bg-hover);
    }

    :host(.secondary) {
      --button-bg: transparent;
      --button-bg-hover: var(--color-bg-hover);
      --button-text: var(--color-text-primary);
      --button-border: var(--border-width-default);
    }

    :host(.danger) {
      --button-bg: var(--color-feedback-error);
      --button-bg-hover: var(--color-feedback-error-hover);
      --button-text: var(--color-text-on-inverse);
    }

    :host(.large) {
      padding: calc(var(--space-16) - var(--button-border))
        calc(var(--space-32) - var(--button-border));
    }

    :host(:disabled) {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `,
})
export class Button {
  readonly variant = input<'primary' | 'secondary' | 'danger'>('primary');
  readonly size = input<'normal' | 'large'>('normal');
}
