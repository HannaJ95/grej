import { formatNumber } from '@angular/common';
import { Component, inject, input, linkedSignal, LOCALE_ID, output } from '@angular/core';

// Whole kronor. undefined = no limit.
export interface PriceLimits {
  min: number | undefined;
  max: number | undefined;
}

type Side = 'low' | 'high';

// Two fields and a slider with two thumbs that follow each other, from 0 to limit. A thumb is
// applied when it is let go, a field on Enter or when the customer leaves it.
@Component({
  selector: 'app-price-range',
  templateUrl: './price-range.html',
  styleUrl: './price-range.scss',
})
export class PriceRange {
  private readonly locale = inject(LOCALE_ID);

  readonly min = input<number>();
  readonly max = input<number>();
  readonly limit = input.required<number>();
  readonly changed = output<PriceLimits>();

  // What the thumbs show, in order and within 0–limit. Starts from the URL every time it changes.
  protected readonly range = linkedSignal(() => this.fromInputs());

  // What the fields show. Typing never changes it, so the text being typed is never replaced.
  protected readonly fields = linkedSignal(() => this.fromInputs());

  protected slide(side: Side, thumb: HTMLInputElement): void {
    const value = this.clamp(side, Number(thumb.value));
    // Set by hand, since the bound value may not have changed when the thumb hits the other one.
    thumb.value = String(value);
    this.range.update((range) => ({ ...range, [side]: value }));
    this.fields.set(this.range());
  }

  protected preview(side: Side, text: string): void {
    const value = toKronor(text);
    if (value !== undefined) {
      this.range.update((range) => ({ ...range, [side]: this.clamp(side, value) }));
    }
  }

  // An empty field means no limit on that side.
  protected type(side: Side, field: HTMLInputElement): void {
    const typed = toKronor(field.value) ?? (side === 'low' ? 0 : this.limit());
    const value = this.clamp(side, typed);
    this.range.update((range) => ({ ...range, [side]: value }));
    this.fields.set(this.range());
    field.value = this.format(value);
    this.apply();
  }

  // The ends of the slider mean no limit, so a later, higher limit isn't cut off.
  protected apply(): void {
    const { low, high } = this.range();
    this.changed.emit({
      min: low > 0 ? low : undefined,
      max: high < this.limit() ? high : undefined,
    });
  }

  protected format(value: number): string {
    return formatNumber(value, this.locale, '1.0-0');
  }

  protected share(value: number): number {
    return value / this.limit();
  }

  private fromInputs(): Record<Side, number> {
    const limit = this.limit();
    const high = Math.min(this.max() ?? limit, limit);
    return { low: Math.min(this.min() ?? 0, high), high };
  }

  // A thumb stops at the other one.
  private clamp(side: Side, value: number): number {
    const { low, high } = this.range();
    return side === 'low'
      ? Math.min(Math.max(value, 0), high)
      : Math.max(Math.min(value, this.limit()), low);
  }
}

// "1 299 kr" becomes 1299, and decimals are dropped. undefined when there are no digits.
function toKronor(text: string): number | undefined {
  const digits = text.split(/[.,]/)[0].replace(/\D/g, '');
  return digits === '' ? undefined : Number(digits);
}
