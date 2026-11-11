import { Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { DEFAULT_SORT, ProductSort, SORTS, toSort } from '../../../core/product-sort';
import { Icon } from '../../../shared/icons/icon';

// The order of the product list, in ?sortera=. <app-sort-select [sort]="sort()" />
@Component({
  selector: 'app-sort-select',
  imports: [Icon],
  template: `
    <!-- aria-label, since the label also holds the options, and "Sortera:" is hidden on a phone. -->
    <label
      class="box text-label-m"
      (pointerdown)="rememberOpen(select)"
      (click)="openFromBox($event, select)"
    >
      <span class="prefix" aria-hidden="true">Sortera:</span>
      <span class="select">
        <select
          #select
          aria-label="Sortera"
          (change)="choose(select.value)"
          (keydown.enter)="openOnEnter($event, select)"
        >
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
    // min-width: 0, so the box can shrink when the text is enlarged.
    :host {
      display: block;
      min-width: 0;
    }

    // The anchor lines the list up with the whole box, not only the select.
    .box {
      anchor-name: --sort-box;
      display: flex;
      align-items: center;
      border: var(--border-width-default) solid var(--color-border-default);
      background: var(--color-bg-surface);
      color: var(--color-text-primary);
      cursor: pointer;

      &:hover {
        background: var(--color-bg-hover);
      }

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

    .select {
      min-width: 0;
    }

    // Longhand paddings, so the room for the chevron in shared/select.scss stays. The min width
    // fits "Nyast först", the longest choice, so the box doesn't jump when the choice changes.
    .box select {
      --padding-left: var(--space-16);

      min-inline-size: min(
        calc(var(--padding-left) + 5.375em + var(--space-48)),
        calc(100vw - 2 * var(--layout-margin) - 2 * var(--border-width-default))
      );
      padding-block: calc(var(--space-8) - var(--border-width-default));
      padding-left: var(--padding-left);
      border: none;
      background: none;
      color: inherit;

      @media (width >= 48rem) {
        --padding-left: var(--space-4);
      }

      // The box has the ring instead.
      &:focus-visible {
        outline: none;
      }

      &::picker(select) {
        position-anchor: --sort-box;
        min-inline-size: anchor-size(width);
      }
    }
  `,
})
export class SortSelect {
  private readonly router = inject(Router);

  readonly sort = input.required<ProductSort>();

  protected readonly options = Object.entries(SORTS).map(([value, { label }]) => ({ value, label }));

  // Read on pointerdown, since the browser closes an open list before the click.
  private wasOpen = false;

  protected rememberOpen(select: HTMLSelectElement): void {
    this.wasOpen = isOpen(select);
  }

  // A label only focuses its select, so a click on "Sortera:" opens the list here. A click on the
  // select itself is left to the browser, and a click that closed the list doesn't open it again.
  protected openFromBox(event: MouseEvent, select: HTMLSelectElement): void {
    if (this.wasOpen || select.contains(event.target as Node)) {
      return;
    }
    select.showPicker?.();
  }

  // Space and the arrows open a select, but Enter, which many try first, doesn't. Enter on an
  // option is left alone, since it chooses that option.
  protected openOnEnter(event: Event, select: HTMLSelectElement): void {
    if (event.target !== select) {
      return;
    }
    event.preventDefault();
    select.showPicker?.();
  }

  // A new order starts on page 1, the default stays out of the URL, and the page doesn't scroll.
  protected choose(value: string): void {
    const sort = toSort(value);
    this.router.navigate(['/produkter'], {
      queryParams: { sortera: sort === DEFAULT_SORT ? null : sort, sida: null },
      queryParamsHandling: 'merge',
      scroll: 'manual',
    });
  }
}

// Browsers without :open throw on the selector.
function isOpen(select: HTMLSelectElement): boolean {
  try {
    return select.matches(':open');
  } catch {
    return false;
  }
}
