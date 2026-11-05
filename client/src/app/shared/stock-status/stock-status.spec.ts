import { TestBed } from '@angular/core/testing';
import { StockStatus } from './stock-status';

describe('StockStatus', () => {
  // The text and the dot's color class for a stock.
  async function show(stock: number): Promise<[string, string]> {
    const fixture = TestBed.createComponent(StockStatus);
    fixture.componentRef.setInput('stock', stock);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    const dot = element.querySelector('.dot')!;
    return [element.textContent!.trim(), [...dot.classList].find((c) => c !== 'dot')!];
  }

  it('says how many are left, with a color for few, some and many', async () => {
    expect(await show(0)).toEqual(['Slutsåld', 'sold-out']);
    expect(await show(2)).toEqual(['Få kvar – 2 st', 'few']);
    expect(await show(4)).toEqual(['I lager – 4 st', 'some']);
    expect(await show(12)).toEqual(['I lager – 12 st', 'many']);
  });
});
