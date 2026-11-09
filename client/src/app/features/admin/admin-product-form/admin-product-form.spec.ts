import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../../app.routes';
import { ConfirmService } from '../../../core/confirm.service';

describe('AdminProductForm', () => {
  let httpTesting: HttpTestingController;
  let harness: RouterTestingHarness;

  const vase = {
    id: 5,
    title: 'Vas',
    description: '',
    price: 300,
    currency: 'SEK',
    stock: 2,
    isActive: true,
    categoryId: 1,
    // Lera and Blå in answerChoices().
    materialIds: [3],
    colorIds: [2],
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
  });

  afterEach(() => {
    httpTesting.verify();
    // Removes the spy on ConfirmService.ask after the test that answers the dialog.
    vi.restoreAllMocks();
  });

  it('shows what is missing and sends nothing when the form is empty', async () => {
    await harness.navigateByUrl('/admin/produkter/ny');
    await answerChoices();

    await send();

    expect(page().textContent).toContain('Fyll i en titel.');
    expect(page().textContent).toContain('Välj en kategori.');
    expect(page().textContent).toContain('Fyll i ett pris.');
  });

  it('creates a hidden product and opens it, so an image can be added', async () => {
    await harness.navigateByUrl('/admin/produkter/ny');
    await answerChoices();

    type('#title', 'Vas');
    choose('#category', '2');
    type('#price', '250');
    await send();

    const request = httpTesting.expectOne((req) => req.url.endsWith('/api/admin/products'));
    expect(request.request.method).toBe('POST');
    // A new product is a hidden draft with one item, unless the admin changes it.
    // The category id is sent as a number, like the API's ProductRequest.
    expect(request.request.body).toEqual({
      title: 'Vas',
      description: '',
      categoryId: 2,
      price: 250,
      stock: 1,
      isActive: false,
      materialIds: [],
      colorIds: [],
    });
    request.flush({ ...vase, categoryId: 2, price: 250, stock: 1, isActive: false });

    // The new product's page asks the API for it. waitFor tries again until it has.
    const opened = await vi.waitFor(() =>
      httpTesting.expectOne((req) => req.url.endsWith('/api/admin/products/5')),
    );
    opened.flush({ ...vase, categoryId: 2, price: 250, stock: 1, isActive: false });
    await answerChoices();
    expect(TestBed.inject(Router).url).toBe('/admin/produkter/5');
    expect(page().textContent).toContain('Produkten har ingen bild än.');
  });

  it('creates a product with its image in one go, and opens it', async () => {
    await harness.navigateByUrl('/admin/produkter/ny');
    await answerChoices();
    type('#title', 'Vas');
    choose('#category', '2');
    type('#price', '250');
    await chooseFile(new File(['png'], 'vas.png', { type: 'image/png' }));
    type('#alt-text', 'En blå vas');

    await send();
    httpTesting
      .expectOne((req) => req.method === 'POST' && req.url.endsWith('/api/admin/products'))
      .flush({ ...vase, isActive: false });
    // The image is uploaded once the product exists, since it needs the product's id.
    const upload = await vi.waitFor(() =>
      httpTesting.expectOne(
        (req) => req.method === 'PUT' && req.url.endsWith('/api/admin/products/5/image'),
      ),
    );
    expect(upload.request.body.get('altText')).toBe('En blå vas');
    const image = { url: 'https://storage.test/vas.png', altText: 'En blå vas' };
    upload.flush(image);

    const opened = await vi.waitFor(() =>
      httpTesting.expectOne((req) => req.method === 'GET' && req.url.endsWith('/api/admin/products/5')),
    );
    opened.flush({ ...vase, image });
    await answerChoices();
    expect(TestBed.inject(Router).url).toBe('/admin/produkter/5');
    expect(toastText()).toBe('Produkten är skapad.');
  });

  it("shows what the image needs together with the form's errors, and sends nothing", async () => {
    await harness.navigateByUrl('/admin/produkter/ny');
    await answerChoices();
    await chooseFile(new File(['png'], 'vas.png', { type: 'image/png' }));

    await send();
    expect(page().textContent).toContain('Fyll i en titel.');
    expect(page().textContent).toContain('Beskriv bilden.');

    // A valid product is not created either while the image lacks its description.
    type('#title', 'Vas');
    choose('#category', '2');
    type('#price', '250');
    await send();
    await settle();
    expect(page().querySelector('[role="alert"]')?.textContent).toBe('Rätta bilden innan du sparar.');
  });

  it('stays on the product after saving, and fetches it again', async () => {
    await openVase();
    type('#title', 'Blå vas');

    await send();
    httpTesting
      .expectOne((req) => req.method === 'PUT' && req.url.endsWith('/api/admin/products/5'))
      .flush(null, { status: 204, statusText: 'No Content' });
    // Fetched again, so the next save compares with the saved stock.
    const reload = await vi.waitFor(() =>
      httpTesting.expectOne((req) => req.method === 'GET' && req.url.endsWith('/api/admin/products/5')),
    );
    reload.flush({ ...vase, title: 'Blå vas' });
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/admin/produkter/5');
    expect(toastText()).toBe('Ändringarna är sparade.');
    expect(page().querySelector<HTMLInputElement>('#title')?.value).toBe('Blå vas');
  });

  it('says when the product does not exist, e.g. after it was removed (404)', async () => {
    await harness.navigateByUrl('/admin/produkter/40');
    httpTesting
      .expectOne((req) => req.url.endsWith('/api/admin/products/40'))
      .flush(null, { status: 404, statusText: 'Not Found' });
    // The category menu is fetched at once, also for a product that is missing.
    await answerList('/api/admin/categories', []);
    await showPage();

    expect(page().textContent).toContain('Produkten finns inte.');
    expect(button('Spara')).toBeUndefined();
  });

  it("selects the product's category when the menu's options arrive after the product", async () => {
    await harness.navigateByUrl('/admin/produkter/5');
    httpTesting.expectOne((req) => req.url.endsWith('/api/admin/products/5')).flush(vase);
    await showPage();
    // The form is shown, but the menu only has "Välj en kategori" so far.
    expect(page().querySelectorAll('#category option').length).toBe(1);

    await answerChoices();

    expect(page().querySelector<HTMLSelectElement>('#category')?.value).toBe('1');
    // A subcategory is shown with its main category.
    expect(page().querySelector('#category option[value="3"]')?.textContent).toBe(
      'Keramik › Skålar',
    );
  });

  it("ticks the product's materials and colors, and sends the changes", async () => {
    await openVase();
    expect(checkbox('Lera').checked).toBe(true);
    expect(checkbox('Glasyr').checked).toBe(false);
    expect(checkbox('Blå').checked).toBe(true);

    // Clicks the way a user does: one unticks Lera, the other ticks Glasyr.
    checkbox('Lera').click();
    checkbox('Glasyr').click();
    await send();

    const request = httpTesting.expectOne((req) => req.url.endsWith('/api/admin/products/5'));
    expect(request.request.body.materialIds).toEqual([4]);
    // Blå was not touched, so it is sent as it was.
    expect(request.request.body.colorIds).toEqual([2]);
  });

  it('saves nothing and says so when the stock has changed (409)', async () => {
    await openVase();

    type('#title', 'Blå vas');
    await send();

    const request = httpTesting.expectOne((req) => req.url.endsWith('/api/admin/products/5'));
    // The stock the form was opened with.
    expect(request.request.body.originalStock).toBe(2);
    request.flush(null, { status: 409, statusText: 'Conflict' });
    await settle();

    expect(page().querySelector('[role="alert"]')?.textContent).toContain(
      'Lagersaldot har ändrats',
    );
    expect(TestBed.inject(Router).url).toBe('/admin/produkter/5');
  });

  it('tells the admin to hide a product that is on an order (409)', async () => {
    await openVase();
    // The test answers yes in the confirm dialog.
    vi.spyOn(TestBed.inject(ConfirmService), 'ask').mockResolvedValue(true);

    button('Ta bort produkten').click();

    // Sent once the dialog's answer has arrived.
    const request = await vi.waitFor(() =>
      httpTesting.expectOne(
        (req) => req.method === 'DELETE' && req.url.endsWith('/api/admin/products/5'),
      ),
    );
    request.flush(null, { status: 409, statusText: 'Conflict' });
    await settle();

    expect(page().querySelector('[role="alert"]')?.textContent).toContain('Dölj den i stället');
  });

  function page(): HTMLElement {
    return harness.routeNativeElement!;
  }

  function toastText(): string | undefined {
    return page().querySelector('app-toast .text')?.textContent ?? undefined;
  }

  // Chooses a file the way a user does. A test cannot set input.files directly, so the file
  // list is replaced on this one input, as in AdminProductImage's spec.
  async function chooseFile(file: File): Promise<void> {
    const input = page().querySelector<HTMLInputElement>('#image-file')!;
    Object.defineProperty(input, 'files', { value: [file] });
    input.dispatchEvent(new Event('change'));
    await harness.fixture.whenStable();
  }

  function button(text: string): HTMLButtonElement {
    return [...page().querySelectorAll('button')].find((b) => b.textContent?.trim() === text)!;
  }

  // Opens the edit page for the vase and answers the API's GET with it.
  async function openVase(): Promise<void> {
    await harness.navigateByUrl('/admin/produkter/5');
    httpTesting.expectOne((req) => req.url.endsWith('/api/admin/products/5')).flush(vase);
    await answerChoices();
  }

  // Answers the form's requests for what it offers: the categories in the menu, and the
  // materials and colors in the checkboxes.
  async function answerChoices(): Promise<void> {
    await answerList('/api/admin/categories', [
      { id: 1, name: 'Keramik', parentId: null, parentName: null },
      { id: 3, name: 'Skålar', parentId: 1, parentName: 'Keramik' },
      { id: 2, name: 'Glas', parentId: null, parentName: null },
    ]);
    await answerList('/api/admin/materials', [
      { id: 4, name: 'Glasyr' },
      { id: 3, name: 'Lera' },
    ]);
    await answerList('/api/admin/colors', [{ id: 2, name: 'Blå' }]);
    await harness.fixture.whenStable();
  }

  // Answers a request for a list with one page that holds all the items. The checkboxes
  // only ask once the form is shown, after the product has arrived, so waitFor tries
  // again until the request has been sent.
  async function answerList(url: string, items: object[]): Promise<void> {
    const request = await vi.waitFor(() => httpTesting.expectOne((req) => req.url.endsWith(url)));
    request.flush({ items, page: 1, pageSize: 100, totalCount: items.length, totalPages: 1 });
  }

  // The checkbox whose label has this text.
  function checkbox(label: string): HTMLInputElement {
    const found = [...page().querySelectorAll('label')].find(
      (l) => l.textContent?.trim() === label,
    );
    return found!.querySelector('input')!;
  }

  // Types into an input the way a user does, so Signal Forms sees the change.
  function type(selector: string, value: string): void {
    const input = page().querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  // Chooses an option the way a user does. Signal Forms listens for "input", as in type().
  function choose(selector: string, value: string): void {
    const select = page().querySelector<HTMLSelectElement>(selector)!;
    select.value = value;
    select.dispatchEvent(new Event('input'));
  }

  // Updates the page without whenStable(), which would wait for the open categories request.
  async function showPage(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    harness.fixture.detectChanges();
  }

  // Clicks "Spara" and waits until the page has updated.
  async function send(): Promise<void> {
    button('Spara').click();
    await harness.fixture.whenStable();
  }

  // Lets the save finish after the API has answered, and waits until the page has updated.
  async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    await harness.fixture.whenStable();
  }
});
