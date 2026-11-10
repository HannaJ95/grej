import { Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { DEFAULT_SORT, ProductSort, SORTS, toSort } from '../../../core/product-sort';
import { Icon } from '../../../shared/icons/icon';

// The order of the product list, in ?sortera=. <app-sort-select [sort]="sort()" />
@Component({
  selector: 'app-sort-select',
  imports: [Icon],
  template: `
    <!-- The box is the label, so a click anywhere in it reaches the select. aria-label names the
         select the same way in every browser, since the label also holds the options, and also on
         a phone, where "Sortera:" is hidden. -->
    <label class="box text-label-m">
      <span class="prefix" aria-hidden="true">Sortera:</span>
      <span class="select">
        <select #select aria-label="Sortera" (change)="choose(select.value)">
          @for (option of options; track option.value) {
            <option [value]="option.value" [selected]="option.value === sort()">
              {{ option.label }}
            </option>
          }
        </select>
        <app-icon name="chevron-down" />
      </span>
    </label>
  `,
  styleUrl: '../../../shared/select.scss',
  styles: `
    // min-width: 0 lets the box shrink to the toolbar's width when the text is enlarged.
    :host {
      display: block;
      min-width: 0;
    }

    // A field box like the search, as tall as the Filter button beside it.
    .box {
      display: flex;
      align-items: center;
      border: var(--border-width-default) solid var(--color-border-default);
      background: var(--color-bg-surface);
      color: var(--color-text-primary);
      cursor: pointer;

      &:hover {
        background: var(--color-bg-hover);
      }

      // focus-visible, so a click with the mouse shows no ring.
      &:has(select:focus-visible) {
        outline: var(--border-width-default) solid var(--color-border-default);
        outline-offset: var(--space-2);
      }
    }

    // A phone shows only the choice, so the box fits beside Filter.
    .prefix {
      display: none;

      @media (width >= 48rem) {
        display: block;
        padding-left: var(--space-16);
        white-space: nowrap;
      }
    }

    // Lets the select shrink below its longest option too. The browser then clips its text.
    .select {
      min-width: 0;
    }

    // Longhand paddings, so the room for the chevron in shared/select.scss stays.
    .box select {
      padding-block: calc(var(--space-8) - var(--border-width-default));
      padding-left: var(--space-16);
      border: none;
      background: none;
      color: inherit;

      @media (width >= 48rem) {
        padding-left: var(--space-4);
      }

      // The box has the ring instead.
      &:focus-visible {
        outline: none;
      }
    }
  `,
})
export class SortSelect {
  private readonly router = inject(Router);

  readonly sort = input.required<ProductSort>();

  protected readonly options = Object.entries(SORTS).map(([value, { label }]) => ({ value, label }));

  // A new order starts on page 1, and the default is left out of the URL. scroll: 'manual' keeps
  // the page still, like the filter.
  protected choose(value: string): void {
    const sort = toSort(value);
    this.router.navigate(['/produkter'], {
      queryParams: { sortera: sort === DEFAULT_SORT ? null : sort, sida: null },
      queryParamsHandling: 'merge',
      scroll: 'manual',
    });
  }
}
