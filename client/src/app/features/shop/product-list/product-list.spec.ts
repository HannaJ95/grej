import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../../app.routes';

describe('ProductList', () => {
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      // The app's real routes, so ?sida= reaches the page the same way as in the app.
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  // Answers the page's requests for the filter's categories, materials and colors.
  function flushFilters(categories: object[] = [], materials: object[] = []): void {
    httpTesting.expectOne((req) => req.url.endsWith('/api/categories')).flush(categories);
    httpTesting.expectOne((req) => req.url.endsWith('/api/materials')).flush(materials);
    httpTesting.expectOne((req) => req.url.endsWith('/api/colors')).flush([]);
  }

  it('fetches the page in ?sida= and links to the pages before and after', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/produkter?sida=2');
    // No categories, so no tabs: the links below are only the page's own.
    flushFilters();

    const request = httpTesting.expectOne((req) => req.url.endsWith('/api/products'));
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.has('minPrice')).toBe(false);
    expect(request.request.params.has('search')).toBe(false);
    request.flush({
      items: [
        { id: 7, title: 'Vas', description: '', price: 300, currency: 'SEK', isSoldOut: false },
      ],
      page: 2,
      pageSize: 12,
      totalCount: 25,
      totalPages: 3,
    });
    await harness.fixture.whenStable();

    // Only the page's links: routeNativeElement is the shop's layout, with its own links.
    const page = harness.routeNativeElement!.querySelector('app-product-list')!;
    const links = [...page.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    // The breadcrumb's "Hem" first, then the product, then the page links (the page
    // numbers twice: the list for a computer and the shorter one for a phone).
    expect(links).toEqual([
      '/',
      '/produkter/7',
      '/produkter?sida=1',
      '/produkter?sida=1',
      '/produkter?sida=3',
      '/produkter?sida=1',
      '/produkter?sida=3',
      '/produkter?sida=3',
    ]);
    // Page 2 with 12 per page starts at the 13th product.
    expect(page.querySelector('.toolbar')!.textContent).toContain('Visar 13–13 av 25 grejer');
    expect(page.querySelector('.intro')!.textContent).toContain('25 handgjorda grejer');
  });

  it('shows the image of each product, with its alt text', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/produkter');
    flushFilters();

    httpTesting
      .expectOne((req) => req.url.endsWith('/api/products'))
      .flush({
        items: [
          {
            id: 7,
            title: 'Vas',
            description: '',
            price: 300,
            currency: 'SEK',
            stock: 1,
            isSoldOut: false,
            image: { url: 'https://storage.test/vas.png', altText: 'En blå vas' },
          },
        ],
        page: 1,
        pageSize: 12,
        totalCount: 1,
        totalPages: 1,
      });
    await harness.fixture.whenStable();

    const image = harness.routeNativeElement!.querySelector('img')!;
    expect(image.getAttribute('src')).toBe('https://storage.test/vas.png');
    expect(image.getAttribute('alt')).toBe('En blå vas');
  });

  it('fetches the categories in ?kategori= and shows them as tabs', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/produkter?kategori=3&kategori=1&sida=2');
    flushFilters([
      { id: 1, name: 'Keramik', productCount: 4, subcategories: [] },
      { id: 3, name: 'Textil', productCount: 2, subcategories: [] },
    ]);

    const request = httpTesting.expectOne((req) => req.url.endsWith('/api/products'));
    expect(request.request.params.getAll('categoryId')).toEqual(['3', '1']);
    expect(request.request.params.get('page')).toBe('2');
    request.flush({ items: [], page: 2, pageSize: 12, totalCount: 0, totalPages: 0 });
    await harness.fixture.whenStable();

    const tabs = harness.routeNativeElement!.querySelector('app-category-tabs')!;
    expect(tabs.textContent).toContain('Keramik');
    // Two categories are chosen, so no single tab is.
    expect(tabs.querySelector('[aria-current]')).toBeNull();
  });

  it('offers all products when no product matches the filter', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/produkter?kategori=99');
    flushFilters();
    httpTesting
      .expectOne((req) => req.url.endsWith('/api/products'))
      .flush({ items: [], page: 1, pageSize: 12, totalCount: 0, totalPages: 0 });
    await harness.fixture.whenStable();

    const results = harness.routeNativeElement!.querySelector('.results')!;
    expect(results.textContent).toContain('Inga grejer matchar filtret.');
    expect(results.querySelector('a')!.getAttribute('href')).toBe('/produkter');
  });

  it('sends the material, color and price in the URL to the API and ticks them', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/produkter?material=4&material=5&farg=2&minpris=200&maxpris=800');
    flushFilters([], [{ id: 4, name: 'Lera', productCount: 2 }]);

    const request = httpTesting.expectOne((req) => req.url.endsWith('/api/products'));
    const params = request.request.params;
    expect(params.getAll('materialId')).toEqual(['4', '5']);
    expect(params.getAll('colorId')).toEqual(['2']);
    expect(params.get('minPrice')).toBe('200');
    expect(params.get('maxPrice')).toBe('800');
    expect(request.request.urlWithParams).not.toContain('categoryId');
    request.flush({ items: [], page: 1, pageSize: 12, totalCount: 0, totalPages: 0 });
    await harness.fixture.whenStable();

    const filters = harness.routeNativeElement!.querySelector('app-product-filters')!;
    expect(filters.querySelector<HTMLInputElement>('input[type="checkbox"]')!.checked).toBe(true);
    // Two materials, a color and a price range.
    const open = harness.routeNativeElement!.querySelector('.open-button')!;
    expect(open.getAttribute('aria-label')).toBe('Filter, 4 valda');
    expect(harness.routeNativeElement!.querySelector('.results')!.textContent).toContain(
      'Inga grejer matchar filtret.',
    );
  });

  it('sends the search in ?sok= to the API and counts it as a choice', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/produkter?sok=%20bl%C3%A5%20sk%C3%A5l%20');
    flushFilters([{ id: 1, name: 'Keramik', productCount: 4, subcategories: [] }]);

    const request = httpTesting.expectOne((req) => req.url.endsWith('/api/products'));
    expect(request.request.params.get('search')).toBe('blå skål');
    request.flush({ items: [], page: 1, pageSize: 12, totalCount: 0, totalPages: 0 });
    await harness.fixture.whenStable();

    const open = harness.routeNativeElement!.querySelector('.open-button')!;
    expect(open.getAttribute('aria-label')).toBe('Filter, 1 vald');
    expect(harness.routeNativeElement!.querySelector('.results')!.textContent).toContain(
      'Inga grejer matchar filtret.',
    );
  });

  it('keeps the price slider while the list reloads', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/produkter');
    flushFilters([{ id: 1, name: 'Keramik', productCount: 4, subcategories: [] }]);
    const empty = { items: [], page: 1, pageSize: 12, totalCount: 0, totalPages: 0 };
    httpTesting
      .expectOne((req) => req.url.endsWith('/api/products'))
      .flush({ ...empty, highestPrice: 4321 });
    await harness.fixture.whenStable();
    const slider = () =>
      harness.routeNativeElement!.querySelector<HTMLInputElement>('input[type="range"]');
    expect(slider()!.max).toBe('4400');

    await harness.navigateByUrl('/produkter?minpris=200');
    const request = httpTesting.expectOne((req) => req.url.endsWith('/api/products'));

    expect(slider()!.max).toBe('4400');
    request.flush({ ...empty, highestPrice: 4321 });
  });
});
