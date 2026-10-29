import { TitleCasePipe } from '@angular/common';
import { Component, computed, inject, input, model, signal } from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import { AdminPropertyService } from '../../../core/admin-property.service';
import { PropertyKind } from '../../../core/product-property';
import { PROPERTY_TEXTS } from '../property-texts';

// A checkbox for every material or every color, used twice in the product form. Its value
// is the ids of the ticked ones, e.g. [2, 5]. Implementing FormValueControl lets the form
// connect it with [formField], the same way as an <input>.
@Component({
  selector: 'app-property-checkboxes',
  imports: [TitleCasePipe],
  template: `
    <!-- fieldset and legend tell screen readers which checkboxes belong together. -->
    <fieldset>
      <legend>{{ texts().plural | titlecase }}</legend>
      @if (choices.isLoading()) {
        <p role="status">Laddar {{ texts().theAll }}…</p>
      } @else if (choices.error()) {
        <p role="alert">{{ texts().theAll | titlecase }} kunde inte visas.</p>
      } @else if (choices.hasValue()) {
        @for (choice of choices.value().items; track choice.id) {
          <!-- The checkbox inside its label, so a click on the name ticks it too. -->
          <label>
            <input
              type="checkbox"
              [checked]="value().includes(choice.id)"
              (change)="toggle(choice.id)"
            />
            {{ choice.name }}
          </label>
        } @empty {
          <p>Det finns inga {{ texts().plural }} än.</p>
        }
      }
    </fieldset>
  `,
})
export class PropertyCheckboxes implements FormValueControl<number[]> {
  private readonly properties = inject(AdminPropertyService);

  // Which list to offer. Set in the product form's template.
  readonly kind = input.required<PropertyKind>();
  // The ticked ids. [formField] keeps it in sync with the form's field, both ways.
  readonly value = model<number[]>([]);

  protected readonly texts = computed(() => PROPERTY_TEXTS[this.kind()]);
  // The first page holds up to 100 (PropertyListQuery), as in the category menu.
  protected readonly choices = this.properties.getProperties(this.kind, signal(1));

  // Unticks a ticked one and ticks an unticked one. Always a new array, never a changed
  // one, so the form sees the change.
  protected toggle(id: number): void {
    this.value.update((ids) =>
      ids.includes(id) ? ids.filter((other) => other !== id) : [...ids, id],
    );
  }
}
