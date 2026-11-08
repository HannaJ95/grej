import { registerLocaleData } from '@angular/common';
import localeSv from '@angular/common/locales/sv';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PriceLimits, PriceRange } from './price-range';

describe('PriceRange', () => {
  async function render(min: number | undefined, max: number | undefined, limit = 1000) {
    registerLocaleData(localeSv);
    TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'sv' }] });
    const fixture = TestBed.createComponent(PriceRange);
    fixture.componentRef.setInput('min', min);
    fixture.componentRef.setInput('max', max);
    fixture.componentRef.setInput('limit', limit);
    const emitted: PriceLimits[] = [];
    fixture.componentInstance.changed.subscribe((limits) => emitted.push(limits));
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    const [lowField, highField] = element.querySelectorAll<HTMLInputElement>('input[type="text"]');
    const [lowThumb, highThumb] = element.querySelectorAll<HTMLInputElement>('input[type="range"]');
    return { fixture, element, emitted, lowField, highField, lowThumb, highThumb };
  }

  // Swedish numbers use a no-break space between the thousands.
  function text(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
  }

  it('shows the chosen prices, and 0 and the limit when nothing is chosen', async () => {
    const { element, lowField, highField, lowThumb, highThumb } = await render(200, undefined, 4500);

    expect([lowField.value, text(highField.value)]).toEqual(['200', '4 500']);
    expect([lowThumb.value, highThumb.value]).toEqual(['200', '4500']);
    const scale = [...element.querySelectorAll('.scale span')].map((span) => text(span.textContent!));
    expect(scale).toEqual(['0 kr', '4 500 kr']);
  });

  it('moves the field with the thumb, stops at the other thumb and applies when let go', async () => {
    const { fixture, emitted, lowField, lowThumb } = await render(undefined, 600);

    lowThumb.value = '900';
    lowThumb.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(lowThumb.value).toBe('600');
    expect(lowField.value).toBe('600');
    expect(emitted).toEqual([]);

    lowThumb.dispatchEvent(new Event('change'));
    expect(emitted).toEqual([{ min: 600, max: 600 }]);
  });

  it('moves the thumb while the customer types, without changing the text', async () => {
    const { fixture, emitted, highField, highThumb } = await render(200, undefined);

    highField.value = '5';
    highField.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    // 5 is below the low thumb, so the thumb stops there.
    expect([highField.value, highThumb.value]).toEqual(['5', '200']);

    highField.value = '500';
    highField.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(highThumb.value).toBe('500');
    expect(emitted).toEqual([]);
  });

  it('applies a changed field within 0 and the limit, and the ends mean no limit', async () => {
    const { fixture, emitted, lowField, highField } = await render(300, 800);

    highField.value = '5 000 kr';
    highField.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect(text(highField.value)).toBe('1 000');
    expect(emitted.at(-1)).toEqual({ min: 300, max: undefined });

    lowField.value = '';
    lowField.dispatchEvent(new Event('change'));
    expect(emitted.at(-1)).toEqual({ min: undefined, max: undefined });
  });
});
