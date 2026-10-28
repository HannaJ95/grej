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

    type('#name', '   ');
    await send();

    expect(page().textContent).toContain('Fyll i ett namn.');
  });

  it('creates a category and goes back to the list', async () => {
    await harness.navigateByUrl('/admin/kategorier/ny');

    type('#name', 'Keramik');
    await send();

    const request = httpTesting.expectOne(
      (req) => req.method === 'POST' && req.url.endsWith('/api/admin/categories'),
    );
    expect(request.request.body).toEqual({ name: 'Keramik' });
    request.flush({ id: 3, name: 'Keramik' });

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

  it('tells the admin to move the products first (409)', async () => {
    await harness.navigateByUrl('/admin/kategorier/3');
    httpTesting
      .expectOne((req) => req.url.endsWith('/api/admin/categories/3'))
      .flush({ id: 3, name: 'Keramik' });
    await harness.fixture.whenStable();
    // The test answers "OK" in the browser's "Are you sure?" dialog.
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    button('Ta bort kategorin').click();

    httpTesting
      .expectOne((req) => req.method === 'DELETE' && req.url.endsWith('/api/admin/categories/3'))
      .flush(null, { status: 409, statusText: 'Conflict' });
    await settle();

    expect(page().querySelector('[role="alert"]')?.textContent).toContain(
      'Flytta produkterna till en annan kategori först.',
    );
  });

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
