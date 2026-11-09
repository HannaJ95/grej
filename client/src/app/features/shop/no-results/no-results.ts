import { Component, computed, inject, input, LOCALE_ID, output } from '@angular/core';
import { NO_FILTER } from '../../../core/product-filter';
import { Button } from '../../../shared/button/button';
import { Icon } from '../../../shared/icons/icon';
import { ActiveFilters } from '../active-filters/active-filters';
import { FilterChip } from '../active-filters/filter-chips';
import { injectShowFilter } from '../show-filter';

// Shown when no product matches the chosen filters: what was chosen, a button that removes it
// all, and the chips to remove one at a time.
// <app-no-results [chips]="chips()" (cleared)="…" />
@Component({
  selector: 'app-no-results',
  imports: [ActiveFilters, Button, Icon],
  template: `
    <app-icon class="icon" name="search" />
    <h2 class="title text-display-m">Inga grejer hittades</h2>
    <p class="text-body-m">
      Vi hittade inget som matchar {{ chosen() }}. Prova att ta bort ett filter{{
        hasPrice() ? ' eller vidga prisintervallet' : ''
      }}.
    </p>
    <button appButton size="large" type="button" (click)="clear()">Rensa alla filter</button>
    <!-- With one choice, the button above already removes it. -->
    @if (chips().length > 1) {
      <div class="one-by-one">
        <p class="text-body-s">Eller ta bort ett i taget:</p>
        <app-active-filters tone="light" [chips]="chips()" [clearAll]="false" />
      </div>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-20);
      padding: var(--space-48) var(--space-20);
      border: var(--border-width-default) solid var(--color-border-default);
      background: var(--color-bg-surface);
      text-align: center;

      @media (width >= 48rem) {
        padding: var(--space-64) var(--space-40);
      }
    }

    .icon {
      --icon-size: 3rem;

      @media (width >= 48rem) {
        --icon-size: 4rem;
      }
    }

    .title {
      margin: 0;
      overflow-wrap: anywhere;
    }

    p {
      max-width: 32rem;
      margin: 0;
    }

    .one-by-one {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
      gap: var(--space-8) var(--space-12);
    }
  `,
})
export class NoResults {
  private readonly locale = inject(LOCALE_ID);
  private readonly show = injectShowFilter();

  readonly chips = input.required<FilterChip[]>();
  // After "Rensa alla filter", so the list can take the focus from the button that disappears.
  readonly cleared = output();

  // "Keramik, Blå och max 150 kr". Intl.ListFormat puts in the commas and "och".
  protected readonly chosen = computed(() => {
    const labels = this.chips().map((chip) =>
      chip.key === 'price' ? chip.label[0].toLowerCase() + chip.label.slice(1) : chip.label,
    );
    if (labels.length === 0) {
      return 'filtret';
    }
    return new Intl.ListFormat(this.locale, { type: 'conjunction' }).format(labels);
  });

  protected readonly hasPrice = computed(() => this.chips().some((chip) => chip.key === 'price'));

  protected clear(): void {
    this.show(NO_FILTER);
    this.cleared.emit();
  }
}
