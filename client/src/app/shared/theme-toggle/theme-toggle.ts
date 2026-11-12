import { booleanAttribute, Component, computed, inject, input } from '@angular/core';
import { ThemeService } from '../../core/theme.service';
import { Icon } from '../icons/icon';

// An attribute on a real <button>, like Button. The text and the icon show the mode a click
// gives, so there is no aria-pressed: "Ljust läge, nedtryckt" would sound like the opposite.
@Component({
  selector: 'button[appThemeToggle]',
  imports: [Icon],
  host: {
    type: 'button',
    '[attr.aria-label]': 'showLabel() ? null : label()',
    '(click)': 'theme.toggle()',
  },
  template: `
    <app-icon [name]="theme.isDark() ? 'sun' : 'moon'" />
    @if (showLabel()) {
      {{ label() }}
    }
  `,
  styles: `
    // No box: the place sets the color and the size.
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
  protected readonly label = computed(() => (this.theme.isDark() ? 'Ljust läge' : 'Mörkt läge'));
}
