import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../../app.routes';

describe('AdminPropertyForm', () => {
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
    // Puts back the real window.confirm after the tests that replaced it.
    vi.restoreAllMocks();
  });

  it('creates a color and goes back to the list', async () => {
    await harness.navigateByUrl('/admin/farger/ny');
    expect(page().querySelector('h2')?.textContent).toBe('Ny färg');

    type('#name', 'Blå');
    await send();

    const request = httpTesting.expectOne(
      (req) => req.method === 'POST' && req.url.endsWith('/api/admin/colors'),
    );
    expect(request.request.body).toEqual({ name: 'Blå' });
    request.flush({ id: 2, name: 'Blå' });

    // The list asks the API for the colors. waitFor tries again until it has.
    const list = await vi.waitFor(() =>
      httpTesting.expectOne((req) => req.method === 'GET' && req.url.endsWith('/api/admin/colors')),
    );
    list.flush({ items: [], page: 1, pageSize: 100, totalCount: 0, totalPages: 0 });
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/admin/farger');
  });

  it('warns that the products lose it too, and deletes nothing if the admin says no', async () => {
    await openMaterial({ id: 3, name: 'Lera', productCount: 2 });
    // The test answers "Avbryt" in the browser's "Are you sure?" dialog.
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);

    button('Ta bort materialet').click();

    expect(confirm).toHaveBeenCalledWith(
      '2 produkter har "Lera", och materialet tas bort från dem också. ' +
        'Vill du ändå ta bort materialet? Det går inte att ångra.',
    );
    // afterEach's verify() fails if a DELETE was sent.
  });

  it('says "1 produkt" and "den" when one product has it', async () => {
    await openMaterial({ id: 3, name: 'Lera', productCount: 1 });
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);

    button('Ta bort materialet').click();

    expect(confirm).toHaveBeenCalledWith(
      '1 produkt har "Lera", och materialet tas bort från den också. ' +
        'Vill du ändå ta bort materialet? Det går inte att ångra.',
    );
  });

  it('deletes a material that no product has and goes back to the list', async () => {
    await openMaterial({ id: 3, name: 'Lera', productCount: 0 });
    // The test answers "OK" this time.
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);

    button('Ta bort materialet').click();

    expect(confirm).toHaveBeenCalledWith('Vill du ta bort "Lera"? Det går inte att ångra.');
    httpTesting
      .expectOne((req) => req.method === 'DELETE' && req.url.endsWith('/api/admin/materials/3'))
      .flush(null, { status: 204, statusText: 'No Content' });
    const list = await vi.waitFor(() =>
      httpTesting.expectOne(
        (req) => req.method === 'GET' && req.url.endsWith('/api/admin/materials'),
      ),
    );
    list.flush({ items: [], page: 1, pageSize: 100, totalCount: 0, totalPages: 0 });
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/admin/material');
  });

  function page(): HTMLElement {
    return harness.routeNativeElement!;
  }

  function button(text: string): HTMLButtonElement {
    return [...page().querySelectorAll('button')].find((b) => b.textContent?.trim() === text)!;
  }

  // Opens the form for a material, and answers the API's GET with it.
  async function openMaterial(material: { id: number; name: string; productCount: number }) {
    await harness.navigateByUrl(`/admin/material/${material.id}`);
    httpTesting
      .expectOne((req) => req.url.endsWith(`/api/admin/materials/${material.id}`))
      .flush(material);
    await harness.fixture.whenStable();
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
});
