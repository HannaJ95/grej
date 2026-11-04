import { Component, input } from '@angular/core';

// The app's button, in three variants and two sizes (Figma: Button). It is an attribute on a
// real <button> or <a>, e.g. <button appButton variant="danger">, so the element keeps
// everything the browser gives it: the keyboard, submitting a form, disabled, and links with
// routerLink. The same idea as Angular Material's matButton. size="large" is the design's big
// button, e.g. "Se nyheterna" and "Till kassan"; the normal size is for forms and the CMS.
@Component({
  selector: 'button[appButton], a[appButton]',
  host: {
    // The variant and size become classes on the element, which the styles below look for.
    '[class.secondary]': "variant() === 'secondary'",
    '[class.danger]': "variant() === 'danger'",
    '[class.large]': "size() === 'large'",
  },
  // The element's own content, e.g. "Spara", is shown where <ng-content /> is.
  template: '<ng-content />',
  styles: `
    // A variant only changes these variables, so one hover rule works for every variant.
    :host {
      --button-bg: var(--color-primary);
      --button-bg-hover: var(--color-primary-hover);
      --button-border: var(--color-primary);
      --button-text: var(--color-on-primary);

      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-4);
      border: 2px solid var(--button-border);
      border-radius: var(--radius);
      background: var(--button-bg);
      color: var(--button-text);
      font-weight: 600;
      text-align: center;
      text-decoration: none;
      cursor: pointer;
    }

    // The color is set again, since a:hover in _base.scss would change a link's text.
    :host(:hover:not(:disabled)) {
      background: var(--button-bg-hover);
      color: var(--button-text);
    }

    // The design's secondary button: only a 2 px frame, on whatever background it is on.
    :host(.secondary) {
      --button-bg: transparent;
      --button-bg-hover: var(--color-primary-subtle);
      --button-border: var(--color-text);
      --button-text: var(--color-text);
    }

    :host(.danger) {
      --button-bg: var(--color-danger);
      --button-bg-hover: var(--color-danger-hover);
      --button-border: var(--color-danger);
      --button-text: var(--color-on-danger);
    }

    // 18 px text with 16 px × 30 px inside the frame, like the design.
    :host(.large) {
      padding: var(--space-4) 1.875rem;
      font-size: 1.125rem;
      line-height: 1;
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
