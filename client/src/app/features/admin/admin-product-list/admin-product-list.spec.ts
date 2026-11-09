import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../../app.routes';
import { AdminProduct } from '../../../core/admin-product.service';
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
    image: null,
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
    await harness.navigateByUrl('/admin/produkter');
  });

  afterEach(() => {
    httpTesting.verify();
    // Removes the spies on ConfirmService.ask after the tests that answer the dialog.
    vi.restoreAllMocks();
  });

  it('shows hidden products and stock below 0, and links to each product', async () => {
    await answerList([draft]);

    expect(page().querySelector('a[href="/admin/produkter/5"]')?.textContent).toBe('Utkast');
    expect(page().textContent).toContain('Dold');
    expect(page().textContent).toContain('fler sålda än det fanns');
    expect(page().querySelector('[aria-label="Redigera Utkast"]')?.getAttribute('href')).toBe(
      '/admin/produkter/5',
    );
  });

  it('removes a product after asking, and fetches the list again', async () => {
    await answerList([draft]);
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
    expect(page().textContent).toContain('Det finns inga produkter än.');
  });

  it('tells the admin to hide a product that is on an order (409)', async () => {
    await answerList([draft]);
    vi.spyOn(TestBed.inject(ConfirmService), 'ask').mockResolvedValue(true);

    removeButton().click();
    await answerDelete(409);
    await harness.fixture.whenStable();

    expect(page().querySelector('[role="alert"]')?.textContent).toContain(
      'Utkast finns i en order och kan inte tas bort.',
    );
  });

  function page(): HTMLElement {
    return harness.routeNativeElement!.querySelector('main')!;
  }

  function removeButton(): HTMLButtonElement {
    return page().querySelector<HTMLButtonElement>('[aria-label="Ta bort Utkast"]')!;
  }

  // Answers the list request with one page, also when the page fetches it again.
  async function answerList(items: AdminProduct[]): Promise<void> {
    const request = await vi.waitFor(() =>
      httpTesting.expectOne((req) => req.method === 'GET' && req.url.endsWith('/api/admin/products')),
    );
    request.flush({ items, page: 1, pageSize: 12, totalCount: items.length, totalPages: 1 });
    await harness.fixture.whenStable();
  }

  // The DELETE is sent once the dialog's answer has arrived, so waitFor tries until it has.
  async function answerDelete(status: 204 | 409): Promise<void> {
    const request = await vi.waitFor(() =>
      httpTesting.expectOne(
        (req) => req.method === 'DELETE' && req.url.endsWith('/api/admin/products/5'),
      ),
    );
    request.flush(null, { status, statusText: status === 204 ? 'No Content' : 'Conflict' });
    // Lets remove() finish after the answer. No whenStable() here: after 204 the list is
    // fetched again, and whenStable() would wait for that request.
    await new Promise((resolve) => setTimeout(resolve));
  }
});
