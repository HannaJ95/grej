import { Component, input, output } from '@angular/core';
import { Icon } from '../../../shared/icons/icon';

// One checkbox row in the product filter: the name and the number of products.
// <app-filter-option [name]="…" [count]="…" [checked]="…" (toggled)="…" />
@Component({
  selector: 'app-filter-option',
  imports: [Icon],
  template: `
    <label class="option">
      <span class="box">
        <input #box type="checkbox" [checked]="checked()" (change)="toggled.emit(box.checked)" />
        <app-icon class="check" name="check" />
      </span>
      <!-- The space makes screen readers say "Keramik 8", not "Keramik8". -->
      <span class="name text-body-m-compact">{{ name() }} </span>
      <span class="count text-body-s">{{ count() }}</span>
    </label>
  `,
  styleUrl: '../../../shared/checkbox.scss',
  styles: `
    .name {
      flex: 1;
      min-width: 0;
      color: var(--color-text-primary);
      overflow-wrap: anywhere;
    }

    .count {
      color: var(--color-text-secondary);
    }
  `,
})
export class FilterOption {
  readonly name = input.required<string>();
  readonly count = input.required<number>();
  readonly checked = input.required<boolean>();
  readonly toggled = output<boolean>();
}
