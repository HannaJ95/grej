import { Component, input } from '@angular/core';
import { Icon, IconName } from '../icons/icon';

// A square button with only an icon, e.g. the close button in the cart (Figma: Close button).
// Like appButton it is an attribute on a real <button>, so the keyboard and disabled work.
// The button has no text, so it always needs an aria-label, e.g.
// <button appIconButton icon="close" aria-label="Stäng">. tone="light" is for dark
// backgrounds, like the menu.
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
      border: 2px solid var(--color-text);
      background: transparent;
      color: var(--color-text);
      cursor: pointer;
    }

    :host(:hover:not(:disabled)) {
      background: var(--color-primary-subtle);
    }

    :host(.light) {
      border-color: var(--color-surface);
      color: var(--color-surface);
    }

    :host(.light:hover:not(:disabled)) {
      background: rgb(248 243 234 / 15%);
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
