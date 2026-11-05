import { Component, input } from '@angular/core';

// The app's button, in three variants and two sizes (Figma: Button). It is an attribute on a
// real <button> or <a>, e.g. <button appButton variant="danger">, so the element keeps
// everything the browser gives it: the keyboard, submitting a form, disabled, and links with
// routerLink. The same idea as Angular Material's matButton. size="large" is the design's
// button, e.g. "Se nyheterna" and "Till kassan"; the normal size is not in Figma and is for
// forms and the CMS. Figma has no hover, so the hover colors are other colors from Figma's
// palette.
@Component({
  selector: 'button[appButton], a[appButton]',
  host: {
    // The variant and size become classes on the element, which the styles below look for.
    // The text style classes come from _typography.scss.
    '[class.secondary]': "variant() === 'secondary'",
    '[class.danger]': "variant() === 'danger'",
    '[class.large]': "size() === 'large'",
    '[class.text-label-l]': "size() === 'large'",
    '[class.text-label-m]': "size() === 'normal'",
  },
  // The element's own content, e.g. "Spara", is shown where <ng-content /> is.
  template: '<ng-content />',
  styles: `
    // A variant only changes these variables, so one hover rule works for every variant.
    :host {
      --button-bg: var(--color-bg-inverse);
      --button-bg-hover: var(--color-graphite);
      --button-text: var(--color-text-on-inverse);
      // The frame is taken from the padding, so every variant is equally tall.
      --button-border: 0px;

      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-8);
      padding: calc(var(--space-8) - var(--button-border))
        calc(var(--space-16) - var(--button-border));
      border: var(--button-border) solid var(--color-border-default);
      background: var(--button-bg);
      color: var(--button-text);
      text-align: center;
      cursor: pointer;
    }

    :host(:hover:not(:disabled)) {
      background: var(--button-bg-hover);
    }

    // The design's secondary button: only a 2 px frame, on whatever background it is on.
    // In Figma the frame makes it 4 px taller than the primary button; here it is not.
    :host(.secondary) {
      --button-bg: transparent;
      --button-bg-hover: var(--color-oat);
      --button-text: var(--color-text-primary);
      --button-border: var(--border-width-default);
    }

    :host(.danger) {
      --button-bg: var(--color-feedback-error);
      --button-bg-hover: var(--color-charcoal);
      --button-text: var(--color-text-on-inverse);
    }

    // 16 px above and below and 32 px on the sides, like Figma's Button.
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
