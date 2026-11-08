import { Component, input } from '@angular/core';

// A button that looks like a link, for actions on the same page:
// <button appLinkButton tone="danger" type="button">Ta bort</button>
@Component({
  selector: 'button[appLinkButton]',
  host: {
    class: 'text-link-s',
    '[class.danger]': "tone() === 'danger'",
  },
  template: '<ng-content />',
  styles: `
    // The padding makes the hit target at least 24 px high.
    :host {
      --link-button-text: var(--color-text-primary);
      --link-button-text-hover: var(--color-text-secondary);

      padding: var(--space-4) 0;
      border: none;
      background: none;
      color: var(--link-button-text);
      cursor: pointer;
    }

    :host(:hover) {
      color: var(--link-button-text-hover);
    }

    :host(.danger) {
      --link-button-text: var(--color-feedback-error);
      --link-button-text-hover: var(--color-text-primary);
    }
  `,
})
export class LinkButton {
  readonly tone = input<'default' | 'danger'>('default');
}
