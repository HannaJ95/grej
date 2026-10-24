import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CheckoutService } from './checkout.service';

describe('CheckoutService', () => {
  let checkout: CheckoutService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    checkout = TestBed.inject(CheckoutService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('returns the rows the API cannot sell when it answers 409', async () => {
    const result = checkout.startCheckout([{ productId: 1, quantity: 3 }]);

    // The same JSON as CheckoutController sends with Conflict.
    httpTesting
      .expectOne((req) => req.url.endsWith('/api/checkout'))
      .flush(
        { unavailableItems: [{ productId: 1, available: 2 }] },
        { status: 409, statusText: 'Conflict' },
      );

    expect(await result).toEqual({ unavailableItems: [{ productId: 1, available: 2 }] });
  });

  it('throws on other errors, e.g. when the API is down', async () => {
    const result = checkout.startCheckout([{ productId: 1, quantity: 1 }]);

    httpTesting
      .expectOne((req) => req.url.endsWith('/api/checkout'))
      .flush(null, { status: 500, statusText: 'Internal Server Error' });

    await expect(result).rejects.toThrow();
  });
});
