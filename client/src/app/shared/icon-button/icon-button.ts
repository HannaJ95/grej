import { Component, input } from '@angular/core';
import { Icon, IconName } from '../icons/icon';

// A square button with only an icon, e.g. the close button in the cart (Figma: Close button).
// Like appButton it is an attribute on a real <button>, so the keyboard and disabled work.
// The button has no text, so it always needs an aria-label, e.g.
// <button appIconButton icon="close" aria-label="Stäng">. tone="light" is for dark
// backgrounds, like the menu. Figma has no hover, so the hover colors are other colors from
// Figma's palette.
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
      background: var(--color-oat);
    }

    :host(.light) {
      border-color: var(--color-border-inverse);
      color: var(--color-icon-inverse);
    }

    :host(.light:hover:not(:disabled)) {
      background: var(--color-graphite);
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
