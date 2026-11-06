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

  it('links to each category, with the subcategories in a list under their main category', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/admin/kategorier');

    // The API sends each main category followed by its subcategories.
    httpTesting
      .expectOne((req) => req.url.endsWith('/api/admin/categories'))
      .flush({
        items: [
          { id: 3, name: 'Keramik', parentId: null, parentName: null },
          { id: 5, name: 'Skålar', parentId: 3, parentName: 'Keramik' },
          { id: 1, name: 'Övrigt', parentId: null, parentName: null },
        ],
        page: 1,
        pageSize: 100,
        totalCount: 3,
        totalPages: 1,
      });
    await harness.fixture.whenStable();

    const page = harness.routeNativeElement!;
    expect(page.querySelector('a[href="/admin/kategorier/3"]')?.textContent).toBe('Keramik');
    expect(page.querySelector('a[href="/admin/kategorier/1"]')?.textContent).toBe('Övrigt');
    // Skålar is in a list inside Keramik's item.
    const subcategory = page.querySelector('a[href="/admin/kategorier/5"]');
    expect(subcategory?.textContent).toBe('Skålar');
    expect(subcategory?.closest('ul')?.closest('li')?.querySelector('a')?.textContent).toBe(
      'Keramik',
    );
  });
});
