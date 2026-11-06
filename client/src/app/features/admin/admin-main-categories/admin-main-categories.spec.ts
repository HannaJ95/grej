import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../../app.routes';
import { Category } from '../../../core/category';

describe('AdminMainCategories', () => {
  let httpTesting: HttpTestingController;
  let harness: RouterTestingHarness;

  // Two main categories and a subcategory, as the API sends them.
  const keramik: Category = {
    id: 3,
    name: 'Keramik',
    parentId: null,
    parentName: null,
    productCount: 42,
    subcategoryCount: 1,
  };
  const skalar: Category = {
    id: 5,
    name: 'Skålar',
    parentId: 3,
    parentName: 'Keramik',
    productCount: 12,
    subcategoryCount: 0,
  };
  const textil: Category = {
    id: 4,
    name: 'Textil',
    parentId: null,
    parentName: null,
    productCount: 1,
    subcategoryCount: 0,
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

  it('lists the main categories with their numbers, also in the menu', async () => {
    await open('/admin/kategorier');

    expect(texts('main .row .name')).toEqual(['Keramik', 'Textil']);
    expect(texts('main .row .meta')).toEqual([
      '1 underkategori · 42 produkter',
      '0 underkategorier · 1 produkt',
    ]);
    expect(page().querySelector('.sidebar a[href="/admin/kategorier"]')?.textContent).toContain(
      'Huvudkategorier 2',
    );
  });

  it('creates a main category and fetches the list again', async () => {
    await open('/admin/kategorier');

    type('#category-name', 'Glas');
    await click('Lägg till huvudkategori');

    const request = httpTesting.expectOne((req) => req.method === 'POST');
    expect(request.request.body).toEqual({ name: 'Glas', parentId: null });
    request.flush({ ...textil, id: 6, name: 'Glas' });
    await answerList();
    expect(texts('main [role="status"]')).toContain('Glas har lagts till.');
    expect(nameInput().value).toBe('');
  });

  it('opens a category in the card with Redigera, and saves the change', async () => {
    await open('/admin/kategorier');

    await click('Redigera');

    expect(TestBed.inject(Router).url).toBe('/admin/kategorier?redigera=3');
    expect(document.activeElement).toBe(nameInput());
    expect(page().querySelector('main h2#category-card-title')?.textContent?.trim()).toBe(
      'Redigera huvudkategori',
    );
    expect(nameInput().value).toBe('Keramik');

    type('#category-name', 'Lera');
    await click('Spara ändringar');

    const request = httpTesting.expectOne((req) => req.method === 'PUT');
    expect(request.request.url).toMatch(/\/api\/admin\/categories\/3$/);
    expect(request.request.body).toEqual({ name: 'Lera', parentId: null });
    request.flush(null, { status: 204, statusText: 'No Content' });
    await answerList();

    // The card is empty again.
    await vi.waitFor(() => expect(TestBed.inject(Router).url).toBe('/admin/kategorier'));
  });

  it('tells the admin to delete the subcategories first (409)', async () => {
    await open('/admin/kategorier');
    // The test answers "OK" in the browser's "Are you sure?" dialog.
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    await click('Ta bort');

    httpTesting
      .expectOne((req) => req.method === 'DELETE' && req.url.endsWith('/api/admin/categories/3'))
      .flush({ reason: 'hasSubcategories' }, { status: 409, statusText: 'Conflict' });
    await settle();

    expect(page().querySelector('main [role="alert"]')?.textContent).toContain(
      'Keramik har underkategorier och kan inte tas bort. Ta bort underkategorierna först.',
    );
  });

  // Opens the page and answers its request for all categories.
  async function open(url: string): Promise<void> {
    await harness.navigateByUrl(url);
    await answerList();
  }

  async function answerList(): Promise<void> {
    const items = [keramik, skalar, textil];
    const request = await vi.waitFor(() =>
      httpTesting.expectOne(
        (req) => req.method === 'GET' && req.url.endsWith('/api/admin/categories'),
      ),
    );
    request.flush({ items, page: 1, pageSize: 100, totalCount: items.length, totalPages: 1 });
    await harness.fixture.whenStable();
  }

  function page(): HTMLElement {
    return harness.routeNativeElement!;
  }

  function nameInput(): HTMLInputElement {
    return page().querySelector<HTMLInputElement>('#category-name')!;
  }

  function texts(selector: string): string[] {
    return [...page().querySelectorAll(selector)].map((e) =>
      e.textContent!.replace(/\s+/g, ' ').trim(),
    );
  }

  // Types into an input the way a user does, so Signal Forms sees the change.
  function type(selector: string, value: string): void {
    const input = page().querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  // Clicks the first button in the page (not the menu) with this text, and waits.
  async function click(text: string): Promise<void> {
    const button = [...page().querySelectorAll<HTMLButtonElement>('main button')].find(
      (b) => b.textContent?.trim() === text,
    )!;
    button.click();
    await settle();
  }

  // Lets a click finish (the request or the navigation), and waits until the page has updated.
  async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    await harness.fixture.whenStable();
  }
});
