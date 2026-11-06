import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../../app.routes';

describe('AdminCategoryForm', () => {
  let httpTesting: HttpTestingController;
  let harness: RouterTestingHarness;

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

  it('shows what is missing and sends nothing when the name is only spaces', async () => {
    await harness.navigateByUrl('/admin/kategorier/ny');
    await answerCategoryList();

    type('#name', '   ');
    await send();

    expect(page().textContent).toContain('Fyll i ett namn.');
  });

  it('creates a category and goes back to the list', async () => {
    await harness.navigateByUrl('/admin/kategorier/ny');
    await answerCategoryList();

    type('#name', 'Keramik');
    await send();

    const request = httpTesting.expectOne(
      (req) => req.method === 'POST' && req.url.endsWith('/api/admin/categories'),
    );
    // No main category chosen: a main category.
    expect(request.request.body).toEqual({ name: 'Keramik', parentId: null });
    request.flush({ id: 3, name: 'Keramik', parentId: null, parentName: null });

    // The list asks the API for the categories. waitFor tries again until it has.
    const list = await vi.waitFor(() =>
      httpTesting.expectOne(
        (req) => req.method === 'GET' && req.url.endsWith('/api/admin/categories'),
      ),
    );
    list.flush({ items: [], page: 1, pageSize: 100, totalCount: 0, totalPages: 0 });
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/admin/kategorier');
  });

  it('offers only the main categories, and sends the chosen one as a number', async () => {
    await harness.navigateByUrl('/admin/kategorier/ny');
    await answerCategoryList();

    // "Ingen" and Keramik and Textil, but not the subcategory Skålar.
    const options = [...page().querySelectorAll('#parent option')].map((o) => o.textContent);
    expect(options).toEqual(['Ingen – detta är en huvudkategori', 'Keramik', 'Textil']);

    type('#name', 'Muggar');
    choose('#parent', '3');
    await send();

    const request = httpTesting.expectOne((req) => req.method === 'POST');
    expect(request.request.body).toEqual({ name: 'Muggar', parentId: 3 });
    // Fails the save, so the test does not have to follow the page back to the list.
    request.flush(null, { status: 500, statusText: 'Server Error' });
    await settle();
  });

  it('has no menu for a category with subcategories', async () => {
    await openKeramik();

    expect(page().querySelector('#parent')).toBeNull();
    expect(page().textContent).toContain(
      'Kategorin har underkategorier, så den är en huvudkategori.',
    );
  });

  it('tells the admin to move the products first (409)', async () => {
    await openKeramik();
    // The test answers "OK" in the browser's "Are you sure?" dialog.
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    button('Ta bort kategorin').click();

    httpTesting
      .expectOne((req) => req.method === 'DELETE' && req.url.endsWith('/api/admin/categories/3'))
      .flush({ reason: 'hasProducts' }, { status: 409, statusText: 'Conflict' });
    await settle();

    expect(page().querySelector('[role="alert"]')?.textContent).toContain(
      'Flytta produkterna till en annan kategori först.',
    );
  });

  it('tells the admin to delete the subcategories first (409)', async () => {
    await openKeramik();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    button('Ta bort kategorin').click();

    httpTesting
      .expectOne((req) => req.method === 'DELETE' && req.url.endsWith('/api/admin/categories/3'))
      .flush({ reason: 'hasSubcategories' }, { status: 409, statusText: 'Conflict' });
    await settle();

    expect(page().querySelector('[role="alert"]')?.textContent).toContain(
      'Ta bort underkategorierna först.',
    );
  });

  // Opens Keramik (id 3), which has the subcategory Skålar, and answers the API's requests.
  async function openKeramik(): Promise<void> {
    await harness.navigateByUrl('/admin/kategorier/3');
    httpTesting
      .expectOne((req) => req.url.endsWith('/api/admin/categories/3'))
      .flush({ id: 3, name: 'Keramik', parentId: null, parentName: null });
    await answerCategoryList();
  }

  // Answers the form's request for all categories, which fills the main category menu.
  async function answerCategoryList(): Promise<void> {
    const items = [
      { id: 3, name: 'Keramik', parentId: null, parentName: null },
      { id: 5, name: 'Skålar', parentId: 3, parentName: 'Keramik' },
      { id: 4, name: 'Textil', parentId: null, parentName: null },
    ];
    httpTesting
      .expectOne((req) => req.method === 'GET' && req.url.endsWith('/api/admin/categories'))
      .flush({ items, page: 1, pageSize: 100, totalCount: items.length, totalPages: 1 });
    await harness.fixture.whenStable();
  }

  function page(): HTMLElement {
    return harness.routeNativeElement!;
  }

  function button(text: string): HTMLButtonElement {
    return [...page().querySelectorAll('button')].find((b) => b.textContent?.trim() === text)!;
  }

  // Types into an input the way a user does, so Signal Forms sees the change.
  function type(selector: string, value: string): void {
    const input = page().querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  // Chooses an option the way a user does, like in the product form's test.
  function choose(selector: string, value: string): void {
    const select = page().querySelector<HTMLSelectElement>(selector)!;
    select.value = value;
    select.dispatchEvent(new Event('input'));
  }

  // Clicks "Spara" and waits until the page has updated.
  async function send(): Promise<void> {
    button('Spara').click();
    await harness.fixture.whenStable();
  }

  // Lets the delete finish after the API has answered, and waits until the page has updated.
  async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    await harness.fixture.whenStable();
  }
});
