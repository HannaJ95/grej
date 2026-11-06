import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../../app.routes';
import { Category } from '../../../core/category';

describe('AdminSubcategories', () => {
  let httpTesting: HttpTestingController;
  let harness: RouterTestingHarness;

  // Two main categories, Keramik with two subcategories and Textil with none.
  const keramik = main(3, 'Keramik', 2);
  const textil = main(4, 'Textil', 0);
  const skalar = sub(5, 'Skålar', keramik, 12);
  const vaser = sub(6, 'Vaser', keramik, 1);

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

  afterEach(() => httpTesting.verify());

  it('shows every subcategory under its main category, and leaves out empty groups', async () => {
    await open('/admin/underkategorier');

    expect(texts('main .group-title')).toEqual(['Keramik · 2']);
    expect(page().querySelector('main .group-title a')?.getAttribute('href')).toBe(
      '/admin/underkategorier/3',
    );
    expect(texts('main .row .name')).toEqual(['Skålar', 'Vaser']);
    expect(texts('main .row .meta')).toEqual(['12 produkter', '1 produkt']);
  });

  it("shows a main category's own page, marked in the menu with each main category", async () => {
    await open('/admin/underkategorier/3');

    expect(page().querySelector('main h1')?.textContent).toBe('Keramik');
    expect(page().querySelector('main .group-title')).toBeNull();
    const menu = page().querySelector('.sidebar')!;
    expect(texts('.sidebar a.level-3')).toEqual(['Keramik 2', 'Textil 0']);
    expect(menu.querySelector('[aria-current="page"]')?.textContent?.trim()).toBe('Keramik 2');
  });

  it("adds a subcategory to the page's main category, which the menu has chosen", async () => {
    await open('/admin/underkategorier/3');
    expect(select().value).toBe('3');

    type('#category-name', 'Muggar');
    await click('Lägg till underkategori');

    const request = httpTesting.expectOne((req) => req.method === 'POST');
    expect(request.request.body).toEqual({ name: 'Muggar', parentId: 3 });
    request.flush(sub(7, 'Muggar', keramik, 0));
    await answerList();

    // Ready for the next one in the same main category.
    expect(texts('main [role="status"]')).toContain('Muggar har lagts till.');
    expect(select().value).toBe('3');
  });

  it('asks for a main category on the page with all, and sends nothing without one', async () => {
    await open('/admin/underkategorier');

    type('#category-name', 'Muggar');
    await click('Lägg till underkategori');

    expect(page().textContent).toContain('Välj en huvudkategori.');
  });

  it('moves a subcategory to another main category', async () => {
    await open('/admin/underkategorier?redigera=5');
    expect(select().value).toBe('3');

    choose('4');
    await click('Spara ändringar');

    const request = httpTesting.expectOne((req) => req.method === 'PUT');
    expect(request.request.url).toMatch(/\/api\/admin\/categories\/5$/);
    expect(request.request.body).toEqual({ name: 'Skålar', parentId: 4 });
    request.flush(null, { status: 204, statusText: 'No Content' });
    await answerList();

    await vi.waitFor(() => expect(TestBed.inject(Router).url).toBe('/admin/underkategorier'));
  });

  function main(id: number, name: string, subcategoryCount: number): Category {
    return { id, name, parentId: null, parentName: null, productCount: 0, subcategoryCount };
  }

  function sub(id: number, name: string, parent: Category, productCount: number): Category {
    return {
      id,
      name,
      parentId: parent.id,
      parentName: parent.name,
      productCount,
      subcategoryCount: 0,
    };
  }

  // Opens the page and answers its request for all categories.
  async function open(url: string): Promise<void> {
    await harness.navigateByUrl(url);
    await answerList();
  }

  async function answerList(): Promise<void> {
    const items = [keramik, skalar, vaser, textil];
    const request = await vi.waitFor(() =>
      httpTesting.expectOne(
        (req) => req.method === 'GET' && req.url.endsWith('/api/admin/categories'),
      ),
    );
    request.flush({ items, page: 1, pageSize: 100, totalCount: items.length, totalPages: 1 });
    await harness.fixture.whenStable();
  }

  function page(): HTMLElement {
    return harness.routeNativeElement!;
  }

  function select(): HTMLSelectElement {
    return page().querySelector<HTMLSelectElement>('#category-parent')!;
  }

  function texts(selector: string): string[] {
    return [...page().querySelectorAll(selector)].map((e) =>
      e.textContent!.replace(/\s+/g, ' ').trim(),
    );
  }

  // Types into an input the way a user does, so Signal Forms sees the change.
  function type(selector: string, value: string): void {
    const input = page().querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  // Chooses a main category the way a user does. Signal Forms listens for "input", as in type().
  function choose(value: string): void {
    select().value = value;
    select().dispatchEvent(new Event('input'));
  }

  // Clicks the button in the page (not the menu) with this text, and waits.
  async function click(text: string): Promise<void> {
    const button = [...page().querySelectorAll<HTMLButtonElement>('main button')].find(
      (b) => b.textContent?.trim() === text,
    )!;
    button.click();
    await new Promise((resolve) => setTimeout(resolve));
    await harness.fixture.whenStable();
  }
});
