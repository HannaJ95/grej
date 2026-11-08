import { Component, input, output } from '@angular/core';
import { Icon } from '../../../shared/icons/icon';

// One checkbox row in the product filter: the name and the number of products.
// <app-filter-option [name]="…" [count]="…" [checked]="…" (toggled)="…" />
@Component({
  selector: 'app-filter-option',
  imports: [Icon],
  template: `
    <label>
      <span class="box">
        <input #box type="checkbox" [checked]="checked()" (change)="toggled.emit(box.checked)" />
        <app-icon class="check" name="check" />
      </span>
      <!-- The space makes screen readers say "Keramik 8", not "Keramik8". -->
      <span class="name text-body-m-compact">{{ name() }} </span>
      <span class="count text-body-s">{{ count() }}</span>
    </label>
  `,
  styles: `
    label {
      display: flex;
      align-items: center;
      gap: var(--space-12);
      cursor: pointer;
    }

    .box {
      position: relative;
      display: grid;
      flex-shrink: 0;
    }

    // Still a real checkbox for the keyboard and screen readers, without the browser's own look.
    input {
      appearance: none;
      width: 1.25rem;
      height: 1.25rem;
      margin: 0;
      border: var(--border-width-default) solid var(--color-border-default);
      background: transparent;
      cursor: pointer;

      &:checked {
        background: var(--color-bg-inverse);
      }
    }

    // pointer-events: none lets a click on the mark reach the checkbox under it.
    .check {
      --icon-size: 0.875rem;

      position: absolute;
      inset: 0;
      margin: auto;
      color: var(--color-text-on-inverse);
      pointer-events: none;
      visibility: hidden;
    }

    input:checked + .check {
      visibility: visible;
    }

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
