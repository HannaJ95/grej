import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../../app.routes';

describe('AdminProductForm', () => {
  let httpTesting: HttpTestingController;
  let harness: RouterTestingHarness;

  const vase = {
    id: 5,
    title: 'Vas',
    description: '',
    price: 300,
    currency: 'SEK',
    stock: 2,
    isActive: true,
  };

  beforeEach(async () => {
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
    harness = await RouterTestingHarness.create();
  });

  afterEach(() => {
    httpTesting.verify();
    // Puts back the real window.confirm after the test that replaced it.
    vi.restoreAllMocks();
  });

  it('shows what is missing and sends nothing when the form is empty', async () => {
    await harness.navigateByUrl('/admin/produkter/ny');

    await send();

    expect(page().textContent).toContain('Fyll i en titel.');
    expect(page().textContent).toContain('Fyll i ett pris.');
  });

  it('creates a hidden product and goes back to the list', async () => {
    await harness.navigateByUrl('/admin/produkter/ny');

    type('#title', 'Vas');
    type('#price', '250');
    await send();

    const request = httpTesting.expectOne((req) => req.url.endsWith('/api/admin/products'));
    expect(request.request.method).toBe('POST');
    // A new product is a hidden draft with one item, unless the admin changes it.
    expect(request.request.body).toEqual({
      title: 'Vas',
      description: '',
      price: 250,
      stock: 1,
      isActive: false,
    });
    request.flush({ ...vase, price: 250, stock: 1, isActive: false });

    // The list page asks the API for its products. waitFor tries again until it has.
    const list = await vi.waitFor(() =>
      httpTesting.expectOne((req) => req.url.endsWith('/api/admin/products')),
    );
    list.flush({ items: [], page: 1, pageSize: 12, totalCount: 0, totalPages: 0 });
    expect(TestBed.inject(Router).url).toBe('/admin/produkter');
  });

  it('saves nothing and says so when the stock has changed (409)', async () => {
    await openVase();

    type('#title', 'Blå vas');
    await send();

    const request = httpTesting.expectOne((req) => req.url.endsWith('/api/admin/products/5'));
    // The stock the form was opened with.
    expect(request.request.body.originalStock).toBe(2);
    request.flush(null, { status: 409, statusText: 'Conflict' });
    await settle();

    expect(page().querySelector('[role="alert"]')?.textContent).toContain(
      'Lagersaldot har ändrats',
    );
    expect(TestBed.inject(Router).url).toBe('/admin/produkter/5');
  });

  it('tells the admin to hide a product that is on an order (409)', async () => {
    await openVase();
    // The test answers "OK" in the browser's "Are you sure?" dialog.
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    button('Ta bort produkten').click();

    httpTesting
      .expectOne((req) => req.method === 'DELETE' && req.url.endsWith('/api/admin/products/5'))
      .flush(null, { status: 409, statusText: 'Conflict' });
    await settle();

    expect(page().querySelector('[role="alert"]')?.textContent).toContain('Dölj den i stället');
  });

  function page(): HTMLElement {
    return harness.routeNativeElement!;
  }

  function button(text: string): HTMLButtonElement {
    return [...page().querySelectorAll('button')].find((b) => b.textContent?.trim() === text)!;
  }

  // Opens the edit page for the vase and answers the API's GET with it.
  async function openVase(): Promise<void> {
    await harness.navigateByUrl('/admin/produkter/5');
    httpTesting.expectOne((req) => req.url.endsWith('/api/admin/products/5')).flush(vase);
    await harness.fixture.whenStable();
  }

  // Types into an input the way a user does, so Signal Forms sees the change.
  function type(selector: string, value: string): void {
    const input = page().querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  // Clicks "Spara" and waits until the page has updated.
  async function send(): Promise<void> {
    button('Spara').click();
    await harness.fixture.whenStable();
  }

  // Lets the save finish after the API has answered, and waits until the page has updated.
  async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    await harness.fixture.whenStable();
  }
});
