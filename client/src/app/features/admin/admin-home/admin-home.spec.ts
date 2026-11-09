import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../../app.routes';

describe('AdminHome', () => {
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
    await harness.navigateByUrl('/admin');
  });

  afterEach(() => httpTesting.verify());

  it('shows the numbers from the lists, with a link to each list', async () => {
    answer('/api/admin/orders', [], 3);
    answer('/api/admin/products', [], 40);
    answer('/api/admin/categories', [
      { id: 1, name: 'Keramik', parentId: null },
      { id: 3, name: 'Skålar', parentId: 1 },
      { id: 2, name: 'Glas', parentId: null },
    ]);
    await harness.fixture.whenStable();

    expect(texts('.count')).toEqual([
      '3 beställningar väntar på dig',
      '40 produkter, även dolda',
      '2 huvudkategorier',
    ]);
    expect([...page().querySelectorAll('a')].map((a) => a.getAttribute('href'))).toEqual([
      '/admin/ordrar',
      '/admin/produkter',
      '/admin/kategorier',
    ]);
  });

  it('says when a number could not be fetched, and keeps the others', async () => {
    httpTesting
      .expectOne((req) => req.url.endsWith('/api/admin/orders'))
      .flush(null, { status: 500, statusText: 'Server Error' });
    answer('/api/admin/products', [], 1);
    answer('/api/admin/categories', []);
    await harness.fixture.whenStable();

    expect(page().querySelector('[role="alert"]')?.textContent).toBe('Siffran kunde inte visas.');
    expect(texts('.count')).toEqual(['1 produkt, även dolda', '0 huvudkategorier']);
  });

  // The page without the menu around it.
  function page(): HTMLElement {
    return harness.routeNativeElement!.querySelector('main')!;
  }

  function texts(selector: string): string[] {
    return [...page().querySelectorAll(selector)].map((e) => e.textContent!.trim().replace(/\s+/g, ' '));
  }

  // Answers a list request with one page. totalCount is the number of items in the whole list.
  function answer(url: string, items: object[], totalCount = items.length): void {
    httpTesting
      .expectOne((req) => req.url.endsWith(url))
      .flush({ items, page: 1, pageSize: 20, totalCount, totalPages: 1 });
  }
});
