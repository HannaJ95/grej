import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
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
    needsCancelling: false,
    needsAttention: false,
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

  // Waits for the list's request, since a search only sends it once the router has navigated.
  async function answer(items: OrderSummary[]) {
    const request = await vi.waitFor(() =>
      httpTesting.expectOne((req) => req.url.endsWith('/api/admin/orders')),
    );
    request.flush({ items, page: 1, pageSize: 20, totalCount: items.length, totalPages: 1 });
    return request.request.params;
  }

  // Returns the page and the ?all= and ?search= the request asked for.
  async function show(url: string, items: OrderSummary[]) {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    const params = await answer(items);
    await harness.fixture.whenStable();

    return {
      harness,
      page: harness.routeNativeElement!,
      all: params.get('all'),
      search: params.get('search'),
    };
  }

  it('asks for the orders to handle by default and links to each one', async () => {
    const { page, all, search } = await show('/admin/ordrar', [paidOrder]);

    expect(all).toBe('false');
    expect(search).toBeNull();
    expect(page.textContent).not.toContain('Rensa sökningen');
    expect(page.querySelector('a[href="/admin/ordrar/7"]')?.textContent).toBe('GREJ-AB12CD34');
    expect(page.querySelector('main a[aria-current="page"]')?.textContent?.trim()).toBe('Att göra');
    // Not the date and the sum, since the tests have no Swedish locale (app.config.ts).
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
    expect(page.querySelector('main a[aria-current="page"]')?.textContent?.trim()).toBe(
      'Alla beställningar',
    );
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

  it('shows which refunded orders need cancelling', async () => {
    const refundedOrder: OrderSummary = {
      ...paidOrder,
      paymentStatus: 'Refunded',
      needsCancelling: true,
    };
    const { page } = await show('/admin/ordrar', [refundedOrder]);

    const status = page.querySelector('tbody td:last-child')?.textContent;
    expect(status).toMatch(/Ej skickad\s+Behöver avbrytas/);
  });

  it('shows which orders were sold twice', async () => {
    const oversoldOrder: OrderSummary = { ...paidOrder, needsAttention: true };
    const { page } = await show('/admin/ordrar', [oversoldOrder]);

    const status = page.querySelector('tbody td:last-child')?.textContent;
    expect(status).toMatch(/Ej skickad\s+Dubbelsåld/);
  });

  it('sends the search to the API, counts the hits and keeps the search in the tabs', async () => {
    const { page, search } = await show('/admin/ordrar?sok=anna', [
      paidOrder,
      { ...paidOrder, id: 8 },
    ]);

    expect(search).toBe('anna');
    expect(page.querySelector<HTMLInputElement>('input[type="search"]')!.value).toBe('anna');
    expect(page.querySelector('.search-info p')?.textContent?.trim()).toBe('2 träffar');
    const tabs = [...page.querySelectorAll('.tab')].map((tab) => tab.getAttribute('href'));
    expect(tabs).toEqual(['/admin/ordrar?sok=anna', '/admin/ordrar?visa=alla&sok=anna']);
  });

  it('starts a new search on page 1 and keeps the tab', async () => {
    const { page } = await show('/admin/ordrar?visa=alla&sida=2', [paidOrder]);
    const field = page.querySelector<HTMLInputElement>('input[type="search"]')!;

    field.value = 'erik';
    field.dispatchEvent(new Event('change'));
    const params = await answer([]);

    expect(TestBed.inject(Router).url).toBe('/admin/ordrar?visa=alla&sok=erik');
    expect([params.get('page'), params.get('search')]).toEqual(['1', 'erik']);
  });

  it('clears the search and keeps the tab', async () => {
    const { harness, page } = await show('/admin/ordrar?visa=alla&sok=anna', [paidOrder]);
    expect(page.querySelector('.search-info p')?.textContent?.trim()).toBe('1 träff');
    const clear = [...page.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'Rensa sökningen',
    )!;

    clear.click();
    const params = await answer([paidOrder]);
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/admin/ordrar?visa=alla');
    expect(params.get('search')).toBeNull();
    expect(page.querySelector('.search-info')).toBeNull();
  });

  it('says when a search finds nothing to do and links to every order', async () => {
    const { page } = await show('/admin/ordrar?sok=anna', []);

    expect(page.querySelector('.search-info p')?.textContent?.trim()).toBe('0 träffar');
    expect(page.querySelector('.state')?.textContent).toMatch(
      /Inget att göra matchar ”anna”\.\s+Sök bland alla beställningar/,
    );
    expect(page.querySelector('.state a')?.getAttribute('href')).toBe(
      '/admin/ordrar?visa=alla&sok=anna',
    );
  });

  it('says when a search finds no order at all', async () => {
    const { page } = await show('/admin/ordrar?visa=alla&sok=anna', []);

    expect(page.querySelector('.state')?.textContent?.trim()).toBe(
      'Inga beställningar matchar ”anna”.',
    );
  });
});
