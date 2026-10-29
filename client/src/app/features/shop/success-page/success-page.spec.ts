import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../../app.routes';
import { CartService } from '../../../core/cart.service';
import { Product } from '../../../core/product.service';

const vase: Product = {
  id: 1,
  title: 'Vas',
  description: '',
  price: 300,
  currency: 'SEK',
  stock: 3,
  isSoldOut: false,
  image: null,
  materials: [],
  colors: [],
};

describe('SuccessPage', () => {
  beforeEach(() => {
    // Every test starts as a new visitor with nothing saved.
    localStorage.clear();
    TestBed.configureTestingModule({
      // The app's real routes, so ?order= reaches the page the same way as from Stripe.
      providers: [provideRouter(routes, withComponentInputBinding())],
    });
  });

  it('shows the order number from the URL without saying that the order is paid', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/kassa/tack?order=GREJ-3F9A1C2B');

    const text = harness.routeNativeElement!.textContent!.toLowerCase();
    expect(text).toContain('grej-3f9a1c2b');
    expect(text).toContain('bekräftas');
    // Only the webhook knows if the order is paid (constraints.md).
    expect(text).not.toContain('betald');
  });

  it('empties the cart', async () => {
    const cart = TestBed.inject(CartService);
    cart.add(vase);

    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/kassa/tack?order=GREJ-3F9A1C2B');

    expect(cart.count()).toBe(0);
    expect(localStorage.getItem('grej.cart')).toBe('[]');
  });
});
