import { TestBed } from '@angular/core/testing';
import { CartService } from '../../../core/cart.service';
import { Product } from '../../../core/product.service';
import { AddedToCart } from './added-to-cart';

describe('AddedToCart', () => {
  const vase: Product = {
    id: 7,
    title: 'Vas',
    description: '',
    price: 300,
    currency: 'SEK',
    stock: 3,
    isSoldOut: false,
    images: [],
    materials: [],
    colors: [],
    parcel: { weightGrams: 900, lengthCm: 25, widthCm: 25, heightCm: 15 },
  };

  // vi.useFakeTimers: the test moves the clock itself, instead of waiting 5 real seconds.
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => vi.useRealTimers());

  function showAfterAdding(): { element: HTMLElement; update: () => void } {
    const fixture = TestBed.createComponent(AddedToCart);
    TestBed.inject(CartService).add(vase);
    fixture.detectChanges();
    return { element: fixture.nativeElement, update: () => fixture.detectChanges() };
  }

  it('shows the added product and closes by itself after 5 seconds', () => {
    const { element, update } = showAfterAdding();
    expect(element.textContent).toContain('Tillagd i varukorgen');
    expect(element.textContent).toContain('Vas');
    expect(element.textContent).toContain('Visa varukorg (1)');

    vi.advanceTimersByTime(5000);
    update();

    expect(element.querySelector('.popup')).toBeNull();
  });

  it('closes with Escape', () => {
    const { element, update } = showAfterAdding();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    update();

    expect(element.querySelector('.popup')).toBeNull();
  });
});
