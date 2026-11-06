import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../../app.routes';

describe('AdminLayout', () => {
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    // A logged-in admin, whose token has the email in its middle part, like the API's.
    const payload = btoa(JSON.stringify({ email: 'admin@example.com' }));
    localStorage.clear();
    localStorage.setItem(
      'grej.auth',
      JSON.stringify({ token: `header.${payload}.signature`, expiresAt: '2999-01-01T00:00:00Z' }),
    );
    // jsdom, which the tests run in, has <dialog> but not showModal(), as in ShopLayout's spec.
    HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
      this.open = true;
    };
    HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
      this.open = false;
    };
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        // Some admin pages call the API, with a fake backend.
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    harness = await RouterTestingHarness.create();
  });

  it('shows the menu around the page and marks the page that is shown', async () => {
    await harness.navigateByUrl('/admin');

    // The menu on a computer. The drawer has a copy of it.
    const menu = sidebar();
    expect(links(menu)).toEqual([
      ['Översikt', '/admin'],
      ['Beställningar', '/admin/ordrar'],
      ['Produkter', '/admin/produkter'],
      ['Visa butiken', '/'],
    ]);
    expect(menu.querySelector('[aria-current="page"]')?.textContent?.trim()).toBe('Översikt');
    expect(menu.textContent).toContain('admin@example.com');
    expect(page().querySelector('main h1')?.textContent).toBe('Översikt');
  });

  it('opens a group on its own pages, and folds it with its button', async () => {
    await harness.navigateByUrl('/admin/kategorier');
    // The category page's own request, answered so the page can settle.
    TestBed.inject(HttpTestingController)
      .expectOne((req) => req.url.endsWith('/api/admin/categories'))
      .flush({ items: [], page: 1, pageSize: 100, totalCount: 0, totalPages: 0 });
    await harness.fixture.whenStable();
    const kategorier = groupButton('Kategorier');

    expect(kategorier.getAttribute('aria-expanded')).toBe('true');
    expect(groupButton('Egenskaper').getAttribute('aria-expanded')).toBe('false');
    // The name and the number of main categories, from the page's answer (none here).
    expect(sidebar().querySelector('[aria-current="page"]')?.textContent?.trim()).toBe(
      'Huvudkategorier 0',
    );

    kategorier.click();
    await harness.fixture.whenStable();

    expect(kategorier.getAttribute('aria-expanded')).toBe('false');
    expect(links(sidebar()).map(([text]) => text)).not.toContain('Huvudkategorier');
  });

  it('opens the menu as a drawer, and closes it when a link is clicked', async () => {
    await harness.navigateByUrl('/admin');
    const drawer = page().querySelector('dialog')!;

    page().querySelector<HTMLButtonElement>('.menu-button')!.click();
    expect(drawer.open).toBe(true);

    drawer.querySelector<HTMLAnchorElement>('a[href="/admin/produkter"]')!.click();
    expect(drawer.open).toBe(false);
    await vi.waitFor(() => expect(TestBed.inject(Router).url).toBe('/admin/produkter'));
  });

  it('logs out and goes to the login page', async () => {
    await harness.navigateByUrl('/admin');

    [...sidebar().querySelectorAll('button')]
      .find((b) => b.textContent?.trim() === 'Logga ut')!
      .click();

    await vi.waitFor(() => expect(TestBed.inject(Router).url).toBe('/admin/logga-in'));
    expect(localStorage.getItem('grej.auth')).toBeNull();
  });

  function page(): HTMLElement {
    return harness.routeNativeElement!;
  }

  // The menu on a computer, not the copy in the drawer.
  function sidebar(): HTMLElement {
    return page().querySelector('.sidebar')!;
  }

  function groupButton(text: string): HTMLButtonElement {
    return [...sidebar().querySelectorAll('button')].find((b) => b.textContent?.trim() === text)!;
  }

  function links(element: HTMLElement): string[][] {
    return [...element.querySelectorAll('a')].map((a) => [
      a.textContent!.trim(),
      a.getAttribute('href')!,
    ]);
  }
});
