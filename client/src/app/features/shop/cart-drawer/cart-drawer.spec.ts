import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CartService } from '../../../core/cart.service';
import { Product } from '../../../core/product.service';
import { CartDrawer } from './cart-drawer';

describe('CartDrawer', () => {
  const vase: Product = {
    id: 7,
    title: 'Vas',
    description: '',
    price: 300,
    currency: 'SEK',
    stock: 3,
    isSoldOut: false,
    images: [{ id: 1, url: 'https://storage.test/vas.png', altText: 'En blå vas' }],
    materials: [],
    colors: [],
    parcel: { weightGrams: 900, lengthCm: 25, widthCm: 25, heightCm: 15 },
    size: { lengthCm: null, widthCm: null, heightCm: null, diameterCm: null, weightGrams: null },
  };

  // Every test starts with an empty cart, since the cart is saved in localStorage.
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  async function show(): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(CartDrawer);
    await fixture.whenStable();
    return fixture.nativeElement;
  }

  it('shows the empty cart with a link to the shop', async () => {
    const element = await show();

    expect(element.querySelector('.empty-title')!.textContent).toContain('Din varukorg');
    expect(element.querySelector('.empty a')!.getAttribute('href')).toBe('/produkter');
  });

  it("shows each row with its picture, quantity and the cart's total", async () => {
    const cart = TestBed.inject(CartService);
    cart.add(vase);
    cart.add(vase);

    const element = await show();

    expect(element.querySelector('.thumbnail')!.getAttribute('src')).toBe(
      'https://storage.test/vas.png',
    );
    expect(element.querySelector('.quantity')!.textContent).toBe('2');
    expect(element.querySelector('.count')!.textContent).toBe('2 grejer');
    expect(element.querySelector('[aria-label="Minska antal Vas"]')).not.toBeNull();
    // The test has no Swedish locale, so only the numbers are checked. Two vases' volume
    // weighs 5 250 g, which costs 129 kr.
    const lines = [...element.querySelectorAll('.line')].map((line) => line.textContent);
    expect(lines[0]).toContain('Produkter');
    expect(lines[0]).toContain('600');
    expect(lines[1]).toContain('Frakt');
    expect(lines[1]).toContain('129');
    expect(element.querySelector('.total')!.textContent).toContain('729');
  });

  it('says that the shipping is added in the checkout when a row has no parcel', async () => {
    localStorage.setItem(
      'grej.cart',
      JSON.stringify([{ productId: 7, title: 'Vas', price: 300, currency: 'SEK', quantity: 1 }]),
    );

    const element = await show();

    expect(element.querySelector('.total')!.textContent).toContain('Summa');
    expect(element.querySelector('.line')!.textContent).toBe('Frakten läggs till i kassan.');
  });

  it('asks the customer to wait when the API answers 429', async () => {
    TestBed.inject(CartService).add(vase);
    const fixture = TestBed.createComponent(CartDrawer);
    await fixture.whenStable();

    const checkout = fixture.componentInstance.goToCheckout();
    TestBed.inject(HttpTestingController)
      .expectOne((req) => req.url.endsWith('/api/checkout'))
      .flush(null, { status: 429, statusText: 'Too Many Requests' });
    await checkout;
    await fixture.whenStable();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('[role="alert"]')!.textContent).toContain(
      'För många försök på kort tid. Vänta en minut och försök igen.',
    );
    // "Till kassan" can be clicked again once the minute has passed.
    expect(element.querySelector<HTMLButtonElement>('button.full-width')!.disabled).toBe(false);
  });
});
