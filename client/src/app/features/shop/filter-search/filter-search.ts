import { Component, input, output } from '@angular/core';
import { Icon } from '../../../shared/icons/icon';

// The search at the top of the product filter. Like the price fields it searches on Enter or when
// the customer leaves the field, so the list doesn't reload for every letter.
// <app-filter-search [value]="filter().search" (searched)="…" />
@Component({
  selector: 'app-filter-search',
  imports: [Icon],
  template: `
    <!-- Enter fires change before the form is sent, so the form only has to stay on the page. -->
    <form role="search" (submit)="$event.preventDefault()">
      <label class="field-box">
        <app-icon name="search" />
        <input
          #field
          class="text-body-m"
          type="search"
          placeholder="Sök…"
          aria-label="Sök bland grejerna"
          maxlength="100"
          enterkeyhint="search"
          autocomplete="off"
          [value]="value()"
          (change)="searched.emit(field.value.trim())"
        />
      </label>
    </form>
  `,
  styleUrl: '../../../shared/field-box.scss',
  styles: `
    :host {
      display: block;
    }

    .field-box {
      --icon-size: 1.25rem;

      gap: var(--space-12);
    }

    // Without the browser's own search look and its clear button, which Firefox doesn't have.
    // "Rensa" clears the search.
    input {
      appearance: none;

      &::-webkit-search-cancel-button {
        appearance: none;
      }

      // Firefox makes the placeholder lighter, which would lower its contrast.
      &::placeholder {
        color: var(--color-text-secondary);
        opacity: 1;
      }
    }
  `,
})
export class FilterSearch {
  // The search in the URL, '' when there is none.
  readonly value = input.required<string>();
  // Not "search": a search field's own DOM event has that name and would reach the parent's
  // listener too.
  readonly searched = output<string>();
}
