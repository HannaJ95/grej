import { Component, input, model } from '@angular/core';
import { Icon } from '../icons/icon';

// <app-quantity-stepper [(quantity)]="amount" [max]="5" label="Vas" />
@Component({
  selector: 'app-quantity-stepper',
  imports: [Icon],
  template: `
    <button
      type="button"
      [attr.aria-label]="'Minska antal ' + label()"
      [disabled]="quantity() <= min()"
      (click)="quantity.set(quantity() - 1)"
    >
      <app-icon name="minus" />
    </button>
    <span class="quantity text-label-s">{{ quantity() }}</span>
    <button
      type="button"
      [attr.aria-label]="'Öka antal ' + label()"
      [disabled]="quantity() >= max()"
      (click)="quantity.set(quantity() + 1)"
    >
      <app-icon name="plus" />
    </button>
  `,
  styles: `
    // A page can make the stepper bigger with --stepper-button-size.
    :host {
      display: inline-flex;
      align-items: center;
      border: var(--border-width-default) solid var(--color-border-default);
    }

    button {
      --icon-size: 0.875rem;

      display: flex;
      align-items: center;
      justify-content: center;
      width: var(--stepper-button-size, 2.25rem);
      height: var(--stepper-button-size, 2.25rem);
      padding: 0;
      border: none;
      background: transparent;
      color: var(--color-icon-default);
      cursor: pointer;

      &:hover:not(:disabled) {
        background: var(--color-bg-hover);
      }

      &:disabled {
        opacity: 0.35;
        cursor: not-allowed;
      }
    }

    .quantity {
      width: 1.75rem;
      text-align: center;
    }
  `,
})
export class QuantityStepper {
  readonly quantity = model.required<number>();
  readonly min = input(1);
  readonly max = input.required<number>();
  // The product's name, for screen readers: "Öka antal Vas".
  readonly label = input.required<string>();
}
