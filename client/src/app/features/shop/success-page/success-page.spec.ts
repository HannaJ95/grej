import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../../app.routes';
import { CartService } from '../../../core/cart.service';
import { OrderConfirmation } from '../../../core/order';
import { Product } from '../../../core/product.service';

const vase: Product = {
  id: 1,
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
  size: { lengthCm: null, widthCm: null, heightCm: null, diameterCm: null, weightGrams: null },
};

const pending: OrderConfirmation = {
  orderNumber: 'GREJ-3F9A1C2B',
  createdAt: '2026-11-12T10:00:00Z',
  paymentStatus: 'Pending',
  paymentProvider: 'Stripe',
  customerName: null,
  customerEmail: null,
  addressLine1: null,
  addressLine2: null,
  postalCode: null,
  city: null,
  shippingMethod: 'Paket till ombud',
  shippingCost: 129,
  total: 1029,
  currency: 'SEK',
  items: [{ title: 'Skål', unitPrice: 450, quantity: 2, lineTotal: 900 }],
};

const paid: OrderConfirmation = {
  ...pending,
  paymentStatus: 'Paid',
  customerName: 'Anna Andersson',
  customerEmail: 'anna@example.com',
  addressLine1: 'Storgatan 1',
  postalCode: '111 22',
  city: 'Stockholm',
};

describe('SuccessPage', () => {
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    // Every test starts as a new visitor with nothing saved.
    localStorage.clear();
    TestBed.configureTestingModule({
      // The app's real routes, so the URL reaches the page the same way as from Stripe.
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => vi.useRealTimers());

  function expectOrderRequest() {
    return httpTesting.expectOne((req) => req.url.endsWith('/api/checkout/cs_test_1'));
  }

  // httpResource hands over its answer, and starts a new request, a moment later.
  async function wait(harness: RouterTestingHarness, ms = 0) {
    await vi.advanceTimersByTimeAsync(ms);
    harness.detectChanges();
  }

  it('shows the order number from the URL without saying that the order is paid', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/kassa/tack?order=GREJ-3F9A1C2B');

    const text = harness.routeNativeElement!.textContent!.toLowerCase();
    expect(text).toContain('grej-3f9a1c2b');
    expect(text).toContain('bekräftas');
    // Only the webhook knows if the order is paid (constraints.md).
    expect(text).not.toContain('betalningen är klar');
  });

  it('lists the next steps', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/kassa/tack?order=GREJ-3F9A1C2B');

    expect(harness.routeNativeElement!.querySelectorAll('ol li').length).toBe(3);
  });

  it('shows the order, and says it is paid once the webhook has arrived', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/kassa/tack?order=GREJ-3F9A1C2B&session=cs_test_1');
    // The page asks again after 2 seconds; the test moves the clock instead of waiting.
    vi.useFakeTimers();

    expectOrderRequest().flush(pending);
    await wait(harness);
    const page = harness.routeNativeElement!;
    expect(page.querySelector('.summary')?.textContent).toContain('Skål');
    expect(page.querySelector('.summary')?.textContent).toContain('2 st');
    expect(page.querySelector('[role="status"]')?.textContent).toContain('bekräftas');
    expect(page.querySelector('.info')).toBeNull();

    await wait(harness, 2000);
    expectOrderRequest().flush(paid);
    await wait(harness);

    expect(page.querySelector('[role="status"]')?.textContent).toContain(
      'Betalningen är klar, och en orderbekräftelse skickas till anna@example.com.',
    );
    const info = page.querySelector('.info')?.textContent;
    expect(info).toContain('111 22 Stockholm');
    expect(info).toContain('Paket till ombud');
    expect(info).toContain('Betald via Stripe');
    // Paid, so the page stops asking.
    await wait(harness, 2000);
    httpTesting.expectNone((req) => req.url.endsWith('/api/checkout/cs_test_1'));
  });

  it('looks as without a session when the API does not know it', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/kassa/tack?order=GREJ-3F9A1C2B&session=cs_test_1');
    vi.useFakeTimers();

    expectOrderRequest().flush(null, { status: 404, statusText: 'Not Found' });
    await wait(harness);

    const page = harness.routeNativeElement!;
    expect(page.querySelector('.summary')).toBeNull();
    expect(page.textContent).toContain('GREJ-3F9A1C2B');
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
