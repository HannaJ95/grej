import { booleanAttribute, Component, inject, input } from '@angular/core';
import { ThemeService } from '../../core/theme.service';
import { Icon } from '../icons/icon';

// An attribute on a real <button>, like Button: <button appThemeToggle showLabel>. aria-pressed
// says whether dark mode is on, and the icon shows what a click gives. Without showLabel,
// "Mörkt läge" is only the aria-label.
@Component({
  selector: 'button[appThemeToggle]',
  imports: [Icon],
  host: {
    type: 'button',
    '[attr.aria-pressed]': 'theme.isDark()',
    '[attr.aria-label]': "showLabel() ? null : 'Mörkt läge'",
    '(click)': 'theme.toggle()',
  },
  template: `
    <app-icon [name]="theme.isDark() ? 'sun' : 'moon'" />
    @if (showLabel()) {
      Mörkt läge
    }
  `,
  styles: `
    // No box: the color comes from where it sits, and the place sets the size.
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--space-8);
      padding: 0;
      border: none;
      background: none;
      color: inherit;
      cursor: pointer;
    }

    :host(:hover) {
      color: var(--theme-toggle-hover, var(--color-text-secondary));
    }
  `,
})
export class ThemeToggle {
  protected readonly theme = inject(ThemeService);
  readonly showLabel = input(false, { transform: booleanAttribute });
}
