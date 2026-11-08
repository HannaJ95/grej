import { Component, computed, input } from '@angular/core';
import { FEW_LEFT } from '../../core/product.service';

// Up to this many (above FEW_LEFT) gives the yellow dot.
const SOME_LEFT = 5;

// A colored dot and the stock as text, e.g. "Få kvar – 2 st". The text says it all, so the dot
// is decoration.
@Component({
  selector: 'app-stock-status',
  host: { class: 'text-label-xs' },
  template: `<span class="dot {{ level() }}" aria-hidden="true"></span>{{ text() }}`,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--space-8);
    }

    .dot {
      width: 0.625rem;
      height: 0.625rem;
      border-radius: 50%;
    }

    .sold-out {
      background: var(--color-text-secondary);
    }

    .few {
      background: var(--color-feedback-error);
    }

    .some {
      background: var(--color-feedback-warning);
    }

    .many {
      background: var(--color-feedback-success);
    }
  `,
})
export class StockStatus {
  readonly stock = input.required<number>();

  protected readonly level = computed(() => {
    const stock = this.stock();
    if (stock <= 0) {
      return 'sold-out';
    }
    if (stock <= FEW_LEFT) {
      return 'few';
    }
    return stock <= SOME_LEFT ? 'some' : 'many';
  });

  protected readonly text = computed(() => {
    const stock = this.stock();
    if (stock <= 0) {
      return 'Slutsåld';
    }
    return `${stock <= FEW_LEFT ? 'Få kvar' : 'I lager'} – ${stock} st`;
  });
}
