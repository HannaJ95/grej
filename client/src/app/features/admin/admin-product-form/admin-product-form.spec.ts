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
    categoryId: 1,
    image: null,
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
    await answerCategories();

    await send();

    expect(page().textContent).toContain('Fyll i en titel.');
    expect(page().textContent).toContain('Välj en kategori.');
    expect(page().textContent).toContain('Fyll i ett pris.');
  });

  it('creates a hidden product and opens it, so an image can be added', async () => {
    await harness.navigateByUrl('/admin/produkter/ny');
    await answerCategories();

    type('#title', 'Vas');
    choose('#category', '2');
    type('#price', '250');
    await send();

    const request = httpTesting.expectOne((req) => req.url.endsWith('/api/admin/products'));
    expect(request.request.method).toBe('POST');
    // A new product is a hidden draft with one item, unless the admin changes it.
    // The category id is sent as a number, like the API's ProductRequest.
    expect(request.request.body).toEqual({
      title: 'Vas',
      description: '',
      categoryId: 2,
      price: 250,
      stock: 1,
      isActive: false,
    });
    request.flush({ ...vase, categoryId: 2, price: 250, stock: 1, isActive: false });

    // The new product's page asks the API for it. waitFor tries again until it has.
    const opened = await vi.waitFor(() =>
      httpTesting.expectOne((req) => req.url.endsWith('/api/admin/products/5')),
    );
    opened.flush({ ...vase, categoryId: 2, price: 250, stock: 1, isActive: false });
    await answerCategories();
    expect(TestBed.inject(Router).url).toBe('/admin/produkter/5');
    expect(page().textContent).toContain('Produkten har ingen bild än.');
  });

  it("selects the product's category when the menu's options arrive after the product", async () => {
    await harness.navigateByUrl('/admin/produkter/5');
    httpTesting.expectOne((req) => req.url.endsWith('/api/admin/products/5')).flush(vase);
    await showPage();
    // The form is shown, but the menu only has "Välj en kategori" so far.
    expect(page().querySelectorAll('#category option').length).toBe(1);

    await answerCategories();

    expect(page().querySelector<HTMLSelectElement>('#category')?.value).toBe('1');
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
    await answerCategories();
  }

  // Answers the form's request for the categories in the menu.
  async function answerCategories(): Promise<void> {
    httpTesting
      .expectOne((req) => req.url.endsWith('/api/admin/categories'))
      .flush({
        items: [
          { id: 1, name: 'Keramik' },
          { id: 2, name: 'Glas' },
        ],
        page: 1,
        pageSize: 100,
        totalCount: 2,
        totalPages: 1,
      });
    await harness.fixture.whenStable();
  }

  // Types into an input the way a user does, so Signal Forms sees the change.
  function type(selector: string, value: string): void {
    const input = page().querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  // Chooses an option the way a user does. Signal Forms listens for "input", as in type().
  function choose(selector: string, value: string): void {
    const select = page().querySelector<HTMLSelectElement>(selector)!;
    select.value = value;
    select.dispatchEvent(new Event('input'));
  }

  // Updates the page without whenStable(), which would wait for the open categories request.
  async function showPage(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    harness.fixture.detectChanges();
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
