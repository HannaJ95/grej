import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../../app.routes';

describe('AdminPropertyList', () => {
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

  it('fetches the colors on /admin/farger and links to each one', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/admin/farger');

    httpTesting
      .expectOne((req) => req.url.endsWith('/api/admin/colors'))
      .flush({
        items: [
          { id: 2, name: 'Blå' },
          { id: 5, name: 'Vit' },
        ],
        page: 1,
        pageSize: 100,
        totalCount: 2,
        totalPages: 1,
      });
    await harness.fixture.whenStable();

    const page = harness.routeNativeElement!;
    expect(page.querySelector('h2')?.textContent).toBe('Färger');
    expect(page.querySelector('a[href="/admin/farger/ny"]')?.textContent).toBe('Ny färg');
    expect(page.querySelector('a[href="/admin/farger/2"]')?.textContent).toBe('Blå');
    expect(page.querySelector('a[href="/admin/farger/5"]')?.textContent).toBe('Vit');
  });

  it('uses the words for materials on /admin/material', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/admin/material');

    httpTesting
      .expectOne((req) => req.url.endsWith('/api/admin/materials'))
      .flush({ items: [], page: 1, pageSize: 100, totalCount: 0, totalPages: 0 });
    await harness.fixture.whenStable();

    const page = harness.routeNativeElement!;
    expect(page.querySelector('h2')?.textContent).toBe('Material');
    expect(page.textContent).toContain('Det finns inga material än.');
  });
});
