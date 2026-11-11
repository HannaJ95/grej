import { Component, ElementRef, input, output, viewChild } from '@angular/core';
import { Icon } from '../icons/icon';

// Searches on Enter or when the field is left, so a list doesn't reload for every letter.
// <app-search-field label="Sök bland grejerna" [value]="filter().search" (searched)="…" />
@Component({
  selector: 'app-search-field',
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
          [attr.aria-label]="label()"
          maxlength="100"
          enterkeyhint="search"
          autocomplete="off"
          [value]="value()"
          (change)="searched.emit(field.value.trim())"
        />
      </label>
    </form>
  `,
  styleUrl: '../field-box.scss',
  styles: `
    :host {
      display: block;
    }

    .field-box {
      --icon-size: 1.25rem;

      gap: var(--space-12);
    }

    // Without the browser's own search look and clear button, which Firefox doesn't have, so it
    // looks the same everywhere. Each page has its own way to clear the search.
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
export class SearchField {
  // The field's name for screen readers, since it has no visible label.
  readonly label = input.required<string>();
  // The search in the URL, '' when there is none.
  readonly value = input.required<string>();
  // Not "search": a search field's own DOM event has that name and would reach the parent's
  // listener too.
  readonly searched = output<string>();

  private readonly field = viewChild.required<ElementRef<HTMLInputElement>>('field');

  // E.g. when the button that cleared the search disappears.
  focus(): void {
    this.field().nativeElement.focus();
  }
}
