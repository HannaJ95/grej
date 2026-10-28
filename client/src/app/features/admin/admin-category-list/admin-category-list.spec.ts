import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../../app.routes';

describe('AdminCategoryList', () => {
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

  it('links to each category', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/admin/kategorier');

    httpTesting
      .expectOne((req) => req.url.endsWith('/api/admin/categories'))
      .flush({
        items: [
          { id: 3, name: 'Keramik' },
          { id: 1, name: 'Övrigt' },
        ],
        page: 1,
        pageSize: 100,
        totalCount: 2,
        totalPages: 1,
      });
    await harness.fixture.whenStable();

    const page = harness.routeNativeElement!;
    expect(page.querySelector('a[href="/admin/kategorier/3"]')?.textContent).toBe('Keramik');
    expect(page.querySelector('a[href="/admin/kategorier/1"]')?.textContent).toBe('Övrigt');
  });
});
