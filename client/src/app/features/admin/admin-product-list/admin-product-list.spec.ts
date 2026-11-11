import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
  TestRequest,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../../app.routes';
import { AdminProduct } from '../../../core/admin-product.service';
import { Category } from '../../../core/category';
import { ConfirmService } from '../../../core/confirm.service';

describe('AdminProductList', () => {
  let httpTesting: HttpTestingController;
  let harness: RouterTestingHarness;

  // A hidden draft whose last item was sold twice.
  const draft: AdminProduct = {
    id: 5,
    title: 'Utkast',
    description: '',
    price: 300,
    currency: 'SEK',
    stock: -1,
    isActive: false,
    categoryId: 1,
    materialIds: [],
    colorIds: [],
    images: [],
    parcel: { weightGrams: 900, lengthCm: 25, widthCm: 25, heightCm: 15 },
    size: { lengthCm: null, widthCm: null, heightCm: null, diameterCm: null, weightGrams: null },
    createdAt: '2026-10-02T09:00:00Z',
  };

  const keramik: Category = {
    id: 3,
    name: 'Keramik',
    parentId: null,
    parentName: null,
    productCount: 1,
    subcategoryCount: 1,
  };
  const vaser: Category = {
    id: 7,
    name: 'Vaser',
    parentId: 3,
    parentName: 'Keramik',
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
    // Removes the spies on ConfirmService.ask.
    vi.restoreAllMocks();
  });

  it('shows hidden products and stock below 0, and links to each product', async () => {
    await open();

    expect(page().querySelector('a[href="/admin/produkter/5"]')?.textContent).toBe('Utkast');
    expect(page().textContent).toContain('Dold');
    expect(page().textContent).toContain('fler sålda än det fanns');
    expect(page().querySelector('[aria-label="Redigera Utkast"]')?.getAttribute('href')).toBe(
      '/admin/produkter/5',
    );
  });

  it('removes a product after asking, and fetches the list again', async () => {
    await open();
    // The test answers yes in the confirm dialog.
    const ask = vi.spyOn(TestBed.inject(ConfirmService), 'ask').mockResolvedValue(true);

    removeButton().click();
    await answerDelete(204);
    await answerList([]);

    expect(ask).toHaveBeenCalledWith(expect.objectContaining({ title: 'Ta bort Utkast?' }));
    // The toast lives in the layout, outside <main>.
    expect(harness.routeNativeElement!.querySelector('app-toast .text')?.textContent).toBe(
      'Utkast har tagits bort.',
    );
    expect(texts('.state')).toEqual(['Det finns inga produkter än.']);
  });

  it('tells the admin to hide a product that is on an order (409)', async () => {
    await open();
    vi.spyOn(TestBed.inject(ConfirmService), 'ask').mockResolvedValue(true);

    removeButton().click();
    await answerDelete(409);
    await harness.fixture.whenStable();

    expect(page().querySelector('[role="alert"]')?.textContent).toContain(
      'Utkast finns i en order och kan inte tas bort.',
    );
  });

  it('sends the choices in the URL to the API, and shows them in the menus', async () => {
    const request = await open(
      '/admin/produkter?sok=vas&kategori=7&material=2&farg=4&visa=dolda&sortera=lagst-pris&sida=2',
    );

    expect(request.request.params.toString()).toBe(
      'page=2&search=vas&categoryId=7&materialId=2&colorId=4&isActive=false&sort=priceAscending',
    );
    expect(page().querySelector<HTMLInputElement>('app-search-field input')!.value).toBe('vas');
    expect(select('#product-filter-category').value).toBe('7');
    expect(select('#product-filter-material').value).toBe('2');
    expect(select('#product-filter-color').value).toBe('4');
    expect(select('#product-filter-visibility').value).toBe('dolda');
    expect(select('#product-filter-sort').value).toBe('lagst-pris');
  });

  it('shows when each product was added, and can sort the oldest first', async () => {
    const request = await open('/admin/produkter?sortera=aldst');

    expect(request.request.params.get('sort')).toBe('oldest');
    expect(texts('th')).toContain('Tillagd');
    // "Tillagd" in the cell is only shown when the row is stacked.
    expect(texts('td.added')).toEqual(['Tillagd 2026-10-02']);
    expect(
      [...select('#product-filter-sort').options].map((o) => o.textContent!.trim()),
    ).toEqual(['Nyast först', 'Äldst först', 'Lägst pris', 'Högst pris']);
    expect(select('#product-filter-sort').value).toBe('aldst');
  });

  it('groups the subcategories under their main category', async () => {
    await open();

    const groups = [...select('#product-filter-category').querySelectorAll('optgroup')];
    expect(groups.map((g) => g.label)).toEqual(['Keramik']);
    expect([...groups[0].querySelectorAll('option')].map((o) => o.textContent!.trim())).toEqual([
      'Alla i Keramik',
      'Vaser',
    ]);
  });

  it('starts a new choice on page 1 and keeps the others, without the default sort', async () => {
    await open('/admin/produkter?sok=vas&sortera=hogst-pris&sida=2');

    choose('#product-filter-material', '2');
    await answerList([]);
    expect(url()).toBe('/admin/produkter?sok=vas&sortera=hogst-pris&material=2');

    choose('#product-filter-sort', 'nyast');
    await answerList([]);
    expect(url()).toBe('/admin/produkter?sok=vas&material=2');
  });

  it('shows the hits, and clears the filters but keeps the sort', async () => {
    await open('/admin/produkter?kategori=3&sortera=hogst-pris');
    expect(texts('.search-info p')).toEqual(['1 träff']);

    button('Rensa filtren').click();
    await answerList([draft]);

    expect(url()).toBe('/admin/produkter?sortera=hogst-pris');
    expect(page().querySelector('.search-info')).toBeNull();
    expect(document.activeElement).toBe(page().querySelector('app-search-field input'));
  });

  it('says when nothing matches the filters', async () => {
    await open('/admin/produkter?sok=xyz', []);

    expect(texts('.state')).toEqual(['Inga produkter matchar filtren.']);
    expect(texts('.search-info p')).toEqual(['0 träffar']);
  });

  // Opens the page and answers its requests: the menus' lists and the products.
  async function open(path = '/admin/produkter', items = [draft]): Promise<TestRequest> {
    await harness.navigateByUrl(path);
    await respond('/api/admin/categories', [keramik, vaser]);
    await respond('/api/admin/materials', [{ id: 2, name: 'Lera' }]);
    await respond('/api/admin/colors', [{ id: 4, name: 'Blå' }]);
    return answerList(items);
  }

  // Answers the list request with one page, also when the page fetches it again.
  async function answerList(items: AdminProduct[]): Promise<TestRequest> {
    const request = await respond('/api/admin/products', items);
    await harness.fixture.whenStable();
    return request;
  }

  // No whenStable() here, since it would wait for the requests that are not answered yet.
  async function respond(path: string, items: unknown[]): Promise<TestRequest> {
    const request = await vi.waitFor(() =>
      httpTesting.expectOne((req) => req.method === 'GET' && req.url.endsWith(path)),
    );
    request.flush({ items, page: 1, pageSize: 12, totalCount: items.length, totalPages: 1 });
    return request;
  }

  // The DELETE is sent once the dialog's answer has arrived, so waitFor tries until it has.
  async function answerDelete(status: 204 | 409): Promise<void> {
    const request = await vi.waitFor(() =>
      httpTesting.expectOne(
        (req) => req.method === 'DELETE' && req.url.endsWith('/api/admin/products/5'),
      ),
    );
    request.flush(null, { status, statusText: status === 204 ? 'No Content' : 'Conflict' });
    // Lets remove() finish. No whenStable(): after 204 the list is fetched again, and
    // whenStable() would wait for that request.
    await new Promise((resolve) => setTimeout(resolve));
  }

  function page(): HTMLElement {
    return harness.routeNativeElement!.querySelector('main')!;
  }

  function url(): string {
    return TestBed.inject(Router).url;
  }

  function texts(selector: string): string[] {
    return [...page().querySelectorAll(selector)].map((e) =>
      e.textContent!.replace(/\s+/g, ' ').trim(),
    );
  }

  function select(selector: string): HTMLSelectElement {
    return page().querySelector<HTMLSelectElement>(selector)!;
  }

  // Chooses an option the way a user does.
  function choose(selector: string, value: string): void {
    select(selector).value = value;
    select(selector).dispatchEvent(new Event('change'));
  }

  function button(text: string): HTMLButtonElement {
    return [...page().querySelectorAll<HTMLButtonElement>('button')].find(
      (b) => b.textContent?.trim() === text,
    )!;
  }

  function removeButton(): HTMLButtonElement {
    return page().querySelector<HTMLButtonElement>('[aria-label="Ta bort Utkast"]')!;
  }
});
