import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../../app.routes';
import { OrderSummary } from '../../../core/order';

describe('AdminOrderList', () => {
  let httpTesting: HttpTestingController;

  // A paid order that is not shipped yet, as the API sends it.
  const paidOrder: OrderSummary = {
    id: 7,
    orderNumber: 'GREJ-AB12CD34',
    createdAt: '2026-11-02T12:00:00Z',
    customerName: 'Anna Svensson',
    total: 900,
    currency: 'SEK',
    status: 'Pending',
    paymentStatus: 'Paid',
    needsRefund: false,
  };

  beforeEach(() => {
    // A logged-in admin, so adminGuard lets the test in.
    localStorage.clear();
    localStorage.setItem('grej.auth', '{"token":"t","expiresAt":"2999-01-01T00:00:00Z"}');
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  // Opens url and answers the page's request with these orders. Returns the page and
  // the ?all= the request asked for.
  async function show(url: string, items: OrderSummary[]) {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);

    const request = httpTesting.expectOne((req) => req.url.endsWith('/api/admin/orders'));
    request.flush({ items, page: 1, pageSize: 20, totalCount: items.length, totalPages: 1 });
    await harness.fixture.whenStable();

    return { page: harness.routeNativeElement!, all: request.request.params.get('all') };
  }

  it('asks for the orders to handle by default and links to each one', async () => {
    const { page, all } = await show('/admin/ordrar', [paidOrder]);

    expect(all).toBe('false');
    expect(page.querySelector('a[href="/admin/ordrar/7"]')?.textContent).toBe('GREJ-AB12CD34');
    expect(page.querySelector('a[aria-current="page"]')?.textContent?.trim()).toBe('Att göra');
    // The date and the sum are left out: the tests run without the app's Swedish locale
    // (app.config.ts), so the pipes format them in English here.
    const cells = [...page.querySelectorAll('tbody td')].map((td) => td.textContent?.trim());
    expect([cells[2], cells[4], cells[5]]).toEqual(['Anna Svensson', 'Betald', 'Ej skickad']);
  });

  it('asks for every order with ?visa=alla', async () => {
    const unpaidOrder: OrderSummary = {
      ...paidOrder,
      customerName: null,
      paymentStatus: 'Pending',
    };
    const { page, all } = await show('/admin/ordrar?visa=alla', [unpaidOrder]);

    expect(all).toBe('true');
    expect(page.querySelector('a[aria-current="page"]')?.textContent?.trim()).toBe('Alla ordrar');
    // Stripe has not sent the customer's name yet.
    expect(page.textContent).toContain('Okänd');
    expect(page.textContent).toContain('Väntar på betalning');
  });

  it('says when there is nothing to do', async () => {
    const { page } = await show('/admin/ordrar', []);

    expect(page.textContent).toContain('Det finns inget att göra just nu.');
  });

  it('shows which orders need a refund', async () => {
    const cancelledOrder: OrderSummary = { ...paidOrder, status: 'Cancelled', needsRefund: true };
    const { page } = await show('/admin/ordrar', [cancelledOrder]);

    const status = page.querySelector('tbody td:last-child')?.textContent;
    expect(status).toMatch(/Avbruten\s+Behöver återbetalas/);
  });
});
