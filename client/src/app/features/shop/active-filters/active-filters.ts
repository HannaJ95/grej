import { booleanAttribute, Component, input } from '@angular/core';
import { NO_FILTER } from '../../../core/product-filter';
import { Icon } from '../../../shared/icons/icon';
import { LinkButton } from '../../../shared/link-button/link-button';
import { injectShowFilter } from '../show-filter';
import { FilterChip } from './filter-chips';

// The chosen filters as chips: × removes one, "Rensa alla" removes them all. Dark in the toolbar,
// light on a light surface.
// <app-active-filters [chips]="chips()" tone="light" [clearAll]="false" />
@Component({
  selector: 'app-active-filters',
  imports: [Icon, LinkButton],
  host: {
    '[class.light]': "tone() === 'light'",
  },
  template: `
    <ul class="list" aria-label="Valda filter">
      @for (chip of chips(); track chip.key) {
        <li>
          <!-- The label starts with what the button does and holds the visible name, so voice
               control finds it too. -->
          <button
            #button
            type="button"
            class="chip text-label-xs"
            [attr.aria-label]="'Ta bort ' + chip.label"
            (click)="remove(chip, button)"
          >
            {{ chip.label }}
            <app-icon name="close" />
          </button>
        </li>
      }
    </ul>
    @if (clearAll()) {
      <button appLinkButton type="button" (click)="show(noFilter)">Rensa alla</button>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-8) var(--space-16);
      min-width: 0;
    }

    .list {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-8);
      min-width: 0;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    // A long search wraps inside its chip instead of widening the page.
    .chip {
      --icon-size: 0.75rem;

      display: inline-flex;
      align-items: center;
      gap: var(--space-6);
      max-width: 100%;
      padding: var(--space-4) var(--space-8);
      border: var(--border-width-default) solid var(--color-border-default);
      background: var(--color-bg-inverse);
      color: var(--color-text-on-inverse);
      text-align: start;
      overflow-wrap: anywhere;
      cursor: pointer;

      &:hover {
        background: var(--color-bg-inverse-hover);
      }
    }

    :host(.light) .chip {
      background: var(--color-bg-surface);
      color: var(--color-text-primary);

      &:hover {
        background: var(--color-bg-hover);
      }
    }
  `,
})
export class ActiveFilters {
  readonly chips = input.required<FilterChip[]>();
  readonly tone = input<'dark' | 'light'>('dark');
  readonly clearAll = input(true, { transform: booleanAttribute });

  protected readonly show = injectShowFilter();
  protected readonly noFilter = NO_FILTER;

  // The chip disappears, so the focus moves to the one beside it first and the keyboard keeps its
  // place.
  protected remove(chip: FilterChip, button: HTMLButtonElement): void {
    const item = button.closest('li')!;
    const beside = item.nextElementSibling ?? item.previousElementSibling;
    beside?.querySelector('button')?.focus();
    this.show(chip.without);
  }
}
