import { Component, input } from '@angular/core';
import { Icon, IconName } from '../icons/icon';

// A square button with only an icon. It has no text, so it always needs an aria-label:
// <button appIconButton icon="close" aria-label="Stäng">. tone="light" is for dark backgrounds.
@Component({
  selector: 'button[appIconButton]',
  imports: [Icon],
  host: {
    '[class.light]': "tone() === 'light'",
  },
  template: '<app-icon [name]="icon()" />',
  styles: `
    :host {
      --icon-size: 1.125rem;

      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: 2.5rem;
      height: 2.5rem;
      padding: 0;
      border: var(--border-width-default) solid var(--color-border-default);
      background: transparent;
      // The icon is painted in the text color (see Icon).
      color: var(--color-icon-default);
      cursor: pointer;
    }

    :host(:hover:not(:disabled)) {
      background: var(--color-bg-hover);
    }

    :host(.light) {
      border-color: var(--color-border-inverse);
      color: var(--color-icon-inverse);
    }

    :host(.light:hover:not(:disabled)) {
      background: var(--color-bg-inverse-hover);
    }

    :host(:disabled) {
      opacity: 0.4;
      cursor: not-allowed;
    }
  `,
})
export class IconButton {
  readonly icon = input.required<IconName>();
  readonly tone = input<'dark' | 'light'>('dark');
}
