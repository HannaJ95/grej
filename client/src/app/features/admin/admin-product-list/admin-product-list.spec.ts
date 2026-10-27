import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../../app.routes';

describe('AdminProductList', () => {
  let httpTesting: HttpTestingController;

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

  it('shows hidden products and stock below 0, and links to each product', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/admin/produkter');

    httpTesting
      .expectOne((req) => req.url.endsWith('/api/admin/products'))
      .flush({
        items: [
          {
            id: 5,
            title: 'Utkast',
            description: '',
            price: 300,
            currency: 'SEK',
            stock: -1,
            isActive: false,
          },
        ],
        page: 1,
        pageSize: 12,
        totalCount: 1,
        totalPages: 1,
      });
    await harness.fixture.whenStable();

    const page = harness.routeNativeElement!;
    expect(page.querySelector('a[href="/admin/produkter/5"]')?.textContent).toBe('Utkast');
    expect(page.textContent).toContain('Dold');
    expect(page.textContent).toContain('fler sålda än det fanns');
  });
});
