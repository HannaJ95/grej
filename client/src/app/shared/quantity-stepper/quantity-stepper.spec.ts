import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { QuantityStepper } from './quantity-stepper';

// A page that binds the quantity both ways, like the product page.
@Component({
  imports: [QuantityStepper],
  template: `<app-quantity-stepper [(quantity)]="quantity" [max]="3" label="Vas" />`,
})
class TestPage {
  readonly quantity = signal(1);
}

describe('QuantityStepper', () => {
  it('counts up and down between 1 and max', async () => {
    const fixture = TestBed.createComponent(TestPage);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    const minus = element.querySelector<HTMLButtonElement>('[aria-label="Minska antal Vas"]')!;
    const plus = element.querySelector<HTMLButtonElement>('[aria-label="Öka antal Vas"]')!;

    expect(minus.disabled).toBe(true);

    plus.click();
    plus.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.quantity()).toBe(3);
    expect(element.querySelector('.quantity')!.textContent).toBe('3');
    expect(plus.disabled).toBe(true);

    minus.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.quantity()).toBe(2);
  });
});
