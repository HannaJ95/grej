import { TitleCasePipe } from '@angular/common';
import { Component, computed, inject, input, model, signal } from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import { AdminPropertyService } from '../../../core/admin-property.service';
import { PropertyKind } from '../../../core/product-property';
import { Icon } from '../../../shared/icons/icon';
import { PROPERTY_TEXTS } from '../property-texts';

// A checkbox for every material or every color, used twice in the product form. Its value is
// the ids of the ticked ones, e.g. [2, 5]. FormValueControl lets the form connect it with
// [formField], like an <input>.
@Component({
  selector: 'app-property-checkboxes',
  imports: [TitleCasePipe, Icon],
  template: `
    <fieldset>
      <legend class="text-label-xs">{{ texts().plural | titlecase }}</legend>
      @if (choices.isLoading()) {
        <p class="text-body-s" role="status">Laddar {{ texts().theAll }}…</p>
      } @else if (choices.error()) {
        <p class="text-body-s" role="alert">{{ texts().theAll | titlecase }} kunde inte visas.</p>
      } @else if (choices.hasValue()) {
        <div class="options">
          @for (choice of choices.value().items; track choice.id) {
            <label class="option">
              <span class="box">
                <input
                  type="checkbox"
                  [checked]="value().includes(choice.id)"
                  (change)="toggle(choice.id)"
                />
                <app-icon class="check" name="check" />
              </span>
              <span class="name text-body-m-compact">{{ choice.name }}</span>
            </label>
          } @empty {
            <p class="text-body-s">Det finns inga {{ texts().plural }} än.</p>
          }
        </div>
      }
    </fieldset>
  `,
  styleUrl: '../../../shared/checkbox.scss',
  styles: `
    fieldset {
      min-width: 0;
      margin: 0;
      padding: 0;
      border: none;
    }

    legend {
      margin-bottom: var(--space-12);
      padding: 0;
    }

    p {
      margin: 0;
    }

    .options {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(8.5rem, 1fr));
      gap: var(--space-12) var(--space-16);
    }

    .name {
      min-width: 0;
      overflow-wrap: anywhere;
    }
  `,
})
export class PropertyCheckboxes implements FormValueControl<number[]> {
  private readonly properties = inject(AdminPropertyService);

  readonly kind = input.required<PropertyKind>();
  // [formField] keeps it in sync with the form's field, both ways.
  readonly value = model<number[]>([]);

  protected readonly texts = computed(() => PROPERTY_TEXTS[this.kind()]);
  // The first page holds up to 100 (PropertyListQuery), as in the category menu.
  protected readonly choices = this.properties.getProperties(this.kind, signal(1));

  // Always a new array, never a changed one, so the form sees the change.
  protected toggle(id: number): void {
    this.value.update((ids) =>
      ids.includes(id) ? ids.filter((other) => other !== id) : [...ids, id],
    );
  }
}
