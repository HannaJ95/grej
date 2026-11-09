import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../../app.routes';
import { ConfirmService } from '../../../core/confirm.service';
import {
  ProductProperty,
  ProductPropertyDetails,
  PropertyKind,
} from '../../../core/product-property';

describe('AdminPropertyList', () => {
  let httpTesting: HttpTestingController;
  let harness: RouterTestingHarness;

  const lera: ProductProperty = { id: 3, name: 'Lera' };
  const tra: ProductProperty = { id: 5, name: 'Trä' };

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
    vi.restoreAllMocks();
  });

  it('shows the colors with the words for colors', async () => {
    await open('/admin/farger', 'colors', [
      { id: 2, name: 'Blå' },
      { id: 4, name: 'Vit' },
    ]);

    expect(page().querySelector('h1')?.textContent).toBe('Färger');
    expect(texts('main h2')).toEqual(['Ny färg', 'Alla färger']);
    expect(texts('main .intro')).toEqual([
      'Färger väljs när du skapar en produkt och visas på produktsidan.',
    ]);
    expect(texts('main .row .name')).toEqual(['Blå', 'Vit']);
    expect(button('Redigera Blå')).toBeDefined();
    expect(button('Ta bort Vit')).toBeDefined();
  });

  it('says when there are no materials yet', async () => {
    await open('/admin/material', 'materials', []);

    expect(page().querySelector('h1')?.textContent).toBe('Material');
    expect(texts('main .state')).toEqual(['Det finns inga material än.']);
  });

  it('creates a material and fetches the list again', async () => {
    await open('/admin/material', 'materials', [lera, tra]);

    type('Bomull');
    await click('Lägg till material');

    const request = httpTesting.expectOne((req) => req.method === 'POST');
    expect(request.request.url).toMatch(/\/api\/admin\/materials$/);
    expect(request.request.body).toEqual({ name: 'Bomull' });
    request.flush({ id: 9, name: 'Bomull' });
    await answerList('materials', [{ id: 9, name: 'Bomull' }, lera, tra]);

    expect(texts('app-toast .text')).toEqual(['Bomull har lagts till.']);
    expect(texts('main .row .name')).toEqual(['Bomull', 'Lera', 'Trä']);
  });

  it('opens a material in the card with Redigera, and saves the new name', async () => {
    await open('/admin/material', 'materials', [lera, tra]);

    await click('Redigera Lera');

    expect(url()).toBe('/admin/material?redigera=3');
    expect(document.activeElement).toBe(nameInput());
    expect(texts('#property-card-title')).toEqual(['Redigera material']);
    expect(nameInput().value).toBe('Lera');

    type('Lergods');
    await click('Spara ändringar');

    const request = httpTesting.expectOne((req) => req.method === 'PUT');
    expect(request.request.url).toMatch(/\/api\/admin\/materials\/3$/);
    expect(request.request.body).toEqual({ name: 'Lergods' });
    request.flush(null, { status: 204, statusText: 'No Content' });
    await answerList('materials', [{ id: 3, name: 'Lergods' }, tra]);

    await vi.waitFor(() => expect(url()).toBe('/admin/material'));
    expect(texts('#property-card-title')).toEqual(['Nytt material']);
  });

  it('keeps ?sida= and empties the card with the button in the top bar', async () => {
    await open('/admin/material?sida=2', 'materials', [lera, tra], 2);

    await click('Redigera Lera');
    expect(url()).toBe('/admin/material?sida=2&redigera=3');

    await click('Nytt material');
    expect(url()).toBe('/admin/material?sida=2');
    expect(texts('#property-card-title')).toEqual(['Nytt material']);
    expect(document.activeElement).toBe(nameInput());
  });

  it('warns that the products lose it too, and deletes nothing if the admin says no', async () => {
    await open('/admin/material', 'materials', [lera, tra]);
    const ask = vi.spyOn(TestBed.inject(ConfirmService), 'ask').mockResolvedValue(false);

    await click('Ta bort Lera');
    await answerDetails({ ...lera, productCount: 2 });

    expect(ask).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Ta bort Lera?',
        message:
          '2 produkter har Lera, och materialet tas bort från dem också. Det går inte att ångra.',
      }),
    );
  });

  it('says "1 produkt" and "den" when one product has it', async () => {
    await open('/admin/material', 'materials', [lera, tra]);
    const ask = vi.spyOn(TestBed.inject(ConfirmService), 'ask').mockResolvedValue(false);

    await click('Ta bort Lera');
    await answerDetails({ ...lera, productCount: 1 });

    expect(ask).toHaveBeenCalledWith(
      expect.objectContaining({
        message: '1 produkt har Lera, och materialet tas bort från den också. Det går inte att ångra.',
      }),
    );
  });

  it('deletes a material that no product has, and fetches the list again', async () => {
    await open('/admin/material', 'materials', [lera, tra]);
    const ask = vi.spyOn(TestBed.inject(ConfirmService), 'ask').mockResolvedValue(true);

    await click('Ta bort Lera');
    await answerDetails({ ...lera, productCount: 0 });

    expect(ask).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Ingen produkt har Lera. Det går inte att ångra.' }),
    );
    httpTesting
      .expectOne((req) => req.method === 'DELETE' && req.url.endsWith('/api/admin/materials/3'))
      .flush(null, { status: 204, statusText: 'No Content' });
    await answerList('materials', [tra]);

    expect(texts('app-toast .text')).toEqual(['Lera har tagits bort.']);
    expect(texts('main .row .name')).toEqual(['Trä']);
  });

  it('says so when a material cannot be deleted', async () => {
    await open('/admin/material', 'materials', [lera, tra]);

    await click('Ta bort Lera');
    const request = await vi.waitFor(() =>
      httpTesting.expectOne((req) => req.url.endsWith('/api/admin/materials/3')),
    );
    request.error(new ProgressEvent('error'));
    await settle();

    expect(texts('main [role="alert"]')).toEqual([
      'Det gick inte att ta bort materialet just nu. Försök igen om en stund.',
    ]);
  });

  async function open(
    path: string,
    kind: PropertyKind,
    items: ProductProperty[],
    pageNumber = 1,
  ): Promise<void> {
    await harness.navigateByUrl(path);
    await answerList(kind, items, pageNumber);
  }

  async function answerList(
    kind: PropertyKind,
    items: ProductProperty[],
    pageNumber = 1,
  ): Promise<void> {
    const request = await vi.waitFor(() =>
      httpTesting.expectOne(
        (req) => req.method === 'GET' && req.url.endsWith(`/api/admin/${kind}`),
      ),
    );
    request.flush({
      items,
      page: pageNumber,
      pageSize: 100,
      totalCount: items.length,
      totalPages: pageNumber,
    });
    await harness.fixture.whenStable();
  }

  async function answerDetails(details: ProductPropertyDetails): Promise<void> {
    const request = await vi.waitFor(() =>
      httpTesting.expectOne((req) => req.url.endsWith(`/api/admin/materials/${details.id}`)),
    );
    request.flush(details);
    await settle();
  }

  function page(): HTMLElement {
    return harness.routeNativeElement!;
  }

  function url(): string {
    return TestBed.inject(Router).url;
  }

  function nameInput(): HTMLInputElement {
    return page().querySelector<HTMLInputElement>('#property-name')!;
  }

  function texts(selector: string): string[] {
    return [...page().querySelectorAll(selector)].map((e) =>
      e.textContent!.replace(/\s+/g, ' ').trim(),
    );
  }

  // Sets the value the way typing does, so Signal Forms sees the change.
  function type(value: string): void {
    nameInput().value = value;
    nameInput().dispatchEvent(new Event('input'));
  }

  // By aria-label when the button has one, otherwise by its text.
  function button(name: string): HTMLButtonElement | undefined {
    return [...page().querySelectorAll<HTMLButtonElement>('main button')].find(
      (b) => (b.getAttribute('aria-label') ?? b.textContent?.trim()) === name,
    );
  }

  async function click(name: string): Promise<void> {
    button(name)!.click();
    await settle();
  }

  // Lets a click finish its request or navigation, then waits for the page to update.
  async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    await harness.fixture.whenStable();
  }
});
