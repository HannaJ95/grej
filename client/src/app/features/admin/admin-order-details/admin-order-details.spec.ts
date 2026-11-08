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
  let harness: RouterTestingHarness;

  // A paid order that is not shipped yet, as the API sends it.
  const paidOrder: OrderDetails = {
    id: 7,
    orderNumber: 'GREJ-AB12CD34',
    createdAt: '2026-11-02T12:00:00Z',
    total: 1100,
    currency: 'SEK',
    status: 'Pending',
    paymentStatus: 'Paid',
    needsRefund: false,
    needsCancelling: false,
    canBeShipped: true,
    canBeCancelled: true,
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

  afterEach(() => {
    httpTesting.verify();
    // Puts back the real window.confirm after the tests that replaced it.
    vi.restoreAllMocks();
  });

  // Opens /admin/ordrar/7 and lets answer() reply to the page's request.
  async function show(answer: (request: TestRequest) => void) {
    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/admin/ordrar/7');
    answer(httpTesting.expectOne((req) => req.url.endsWith('/api/admin/orders/7')));
    await harness.fixture.whenStable();
    // Only the page, without the admin's menu around it, so the menu's buttons are not counted.
    return harness.routeNativeElement!.querySelector('main')!;
  }

  function texts(page: HTMLElement, selector: string): string[] {
    return [...page.querySelectorAll(selector)].map((element) => element.textContent!.trim());
  }

  function buttonTexts(page: HTMLElement): string[] {
    return texts(page, 'button');
  }

  function button(page: HTMLElement, text: string): HTMLButtonElement {
    return [...page.querySelectorAll('button')].find((b) => b.textContent?.trim() === text)!;
  }

  // Answers the POST that a button sent, then the request that fetches the order again.
  async function answerChange(action: 'ship' | 'cancel', status: number, order: OrderDetails) {
    httpTesting
      .expectOne(
        (req) => req.method === 'POST' && req.url.endsWith(`/api/admin/orders/7/${action}`),
      )
      .flush(null, { status, statusText: status === 204 ? 'No Content' : 'Conflict' });
    // The page asks for the order again once the POST is done. waitFor tries until it has.
    const reload = await vi.waitFor(() =>
      httpTesting.expectOne(
        (req) => req.method === 'GET' && req.url.endsWith('/api/admin/orders/7'),
      ),
    );
    reload.flush(order);
    await harness.fixture.whenStable();
  }

  it('shows the order, its customer and its rows', async () => {
    const page = await show((request) => request.flush(paidOrder));

    expect(page.querySelector('h1')?.textContent).toBe('Order GREJ-AB12CD34');
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
    expect(texts(page, 'tbody td:nth-child(2)')).toEqual(['2 st', '1 st']);
    // The API says a paid order that is not shipped can be both shipped and cancelled.
    expect(buttonTexts(page)).toEqual(['Markera som skickad', 'Avbryt ordern']);
  });

  it('says that an unpaid order has no customer details', async () => {
    const unpaidOrder: OrderDetails = {
      ...paidOrder,
      paymentStatus: 'Pending',
      canBeShipped: false,
      canBeCancelled: false,
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
    expect(buttonTexts(page)).toEqual([]);
  });

  it('marks the order as shipped and shows it again', async () => {
    const page = await show((request) => request.flush(paidOrder));
    // The test answers "OK" in the browser's "Are you sure?" dialog.
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);

    button(page, 'Markera som skickad').click();
    await answerChange('ship', 204, {
      ...paidOrder,
      status: 'Shipped',
      canBeShipped: false,
      canBeCancelled: false,
    });

    expect(confirm).toHaveBeenCalledWith(
      'Vill du markera ordern som skickad? Det går inte att ångra.',
    );
    expect(texts(page, 'dd')[1]).toBe('Skickad');
    expect(buttonTexts(page)).toEqual([]);
    // The clicked button is gone, so the focus is on the message instead.
    const message = page.querySelector<HTMLElement>('[role="status"]')!;
    expect(message.textContent).toBe('Ordern är markerad som skickad.');
    expect(document.activeElement).toBe(message);
  });

  it('sends nothing when the admin answers no', async () => {
    const page = await show((request) => request.flush(paidOrder));
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    button(page, 'Avbryt ordern').click();
    await harness.fixture.whenStable();

    // afterEach's verify() fails if a POST was sent.
    expect(page.querySelector('[role="status"]')?.textContent).toBe('');
  });

  it('says so when the order cannot be changed, and shows it again', async () => {
    const page = await show((request) => request.flush(paidOrder));
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    button(page, 'Avbryt ordern').click();
    // 409: e.g. the order was shipped in another tab.
    await answerChange('cancel', 409, {
      ...paidOrder,
      status: 'Shipped',
      canBeShipped: false,
      canBeCancelled: false,
    });

    expect(page.querySelector('[role="status"]')?.textContent).toBe(
      'Ordern kunde inte ändras just nu. Försök igen om en stund.',
    );
    expect(texts(page, 'dd')[1]).toBe('Skickad');
  });

  it('says that a cancelled paid order needs a refund', async () => {
    const page = await show((request) =>
      request.flush({
        ...paidOrder,
        status: 'Cancelled',
        needsRefund: true,
        canBeShipped: false,
        canBeCancelled: false,
      }),
    );

    expect(texts(page, 'dd')[1]).toBe('Avbruten');
    expect(page.textContent).toContain('Behöver återbetalas.');
    expect(buttonTexts(page)).toEqual([]);
  });

  it('says that a refunded order needs cancelling and offers only to cancel it', async () => {
    const page = await show((request) =>
      request.flush({
        ...paidOrder,
        paymentStatus: 'Refunded',
        needsCancelling: true,
        canBeShipped: false,
        canBeCancelled: true,
      }),
    );

    expect(texts(page, 'dd')[2]).toBe('Återbetald');
    expect(page.textContent).toContain('Behöver avbrytas.');
    expect(buttonTexts(page)).toEqual(['Avbryt ordern']);
  });

  it('says so when the order cannot be shown, e.g. an unknown id', async () => {
    const page = await show((request) =>
      request.flush(null, { status: 404, statusText: 'Not Found' }),
    );

    expect(page.querySelector('[role="alert"]')?.textContent).toBe('Ordern kunde inte visas.');
  });
});
