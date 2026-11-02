import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
  TestRequest,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../../app.routes';
import { OrderDetails } from '../../../core/order';

describe('AdminOrderDetails', () => {
  let httpTesting: HttpTestingController;

  // A paid order that is not shipped yet, as the API sends it.
  const paidOrder: OrderDetails = {
    id: 7,
    orderNumber: 'GREJ-AB12CD34',
    createdAt: '2026-11-02T12:00:00Z',
    total: 1100,
    currency: 'SEK',
    status: 'Pending',
    paymentStatus: 'Paid',
    customerName: 'Anna Svensson',
    customerEmail: 'anna@example.com',
    addressLine1: 'Storgatan 1',
    addressLine2: null,
    postalCode: '123 45',
    city: 'Stockholm',
    country: 'SE',
    items: [
      { title: 'Skål', unitPrice: 450, quantity: 2, lineTotal: 900 },
      { title: 'Vas', unitPrice: 200, quantity: 1, lineTotal: 200 },
    ],
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

  // Opens /admin/ordrar/7 and lets answer() reply to the page's request.
  async function show(answer: (request: TestRequest) => void) {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/admin/ordrar/7');
    answer(httpTesting.expectOne((req) => req.url.endsWith('/api/admin/orders/7')));
    await harness.fixture.whenStable();
    return harness.routeNativeElement!;
  }

  function texts(page: HTMLElement, selector: string): string[] {
    return [...page.querySelectorAll(selector)].map((element) => element.textContent!.trim());
  }

  it('shows the order, its customer and its rows', async () => {
    const page = await show((request) => request.flush(paidOrder));

    expect(page.querySelector('h2')?.textContent).toBe('Order GREJ-AB12CD34');
    expect(texts(page, 'dt')).toEqual(['Datum', 'Status', 'Betalning', 'Namn', 'E-post', 'Adress']);
    // The date is left out, as in AdminOrderList's spec.
    expect(texts(page, 'dd').slice(1, 5)).toEqual([
      'Ej skickad',
      'Betald',
      'Anna Svensson',
      'anna@example.com',
    ]);
    expect(texts(page, 'dd')[5]).toMatch(/Storgatan 1\s+123 45 Stockholm\s+SE/);
    expect(texts(page, 'tbody td:first-child')).toEqual(['Skål', 'Vas']);
    expect(texts(page, 'tbody td:nth-child(2)')).toEqual(['2', '1']);
  });

  it('says that an unpaid order has no customer details', async () => {
    const unpaidOrder: OrderDetails = {
      ...paidOrder,
      paymentStatus: 'Pending',
      customerName: null,
      customerEmail: null,
      addressLine1: null,
      postalCode: null,
      city: null,
      country: null,
    };
    const page = await show((request) => request.flush(unpaidOrder));

    expect(page.textContent).toContain('Väntar på betalning');
    expect(page.textContent).toContain('Inga kunduppgifter.');
  });

  it('says so when the order cannot be shown, e.g. an unknown id', async () => {
    const page = await show((request) =>
      request.flush(null, { status: 404, statusText: 'Not Found' }),
    );

    expect(page.querySelector('[role="alert"]')?.textContent).toBe('Ordern kunde inte visas.');
  });
});
