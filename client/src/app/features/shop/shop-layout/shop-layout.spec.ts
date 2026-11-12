import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ShopLayout } from './shop-layout';

describe('ShopLayout', () => {
  async function show(categories: object[] = []): Promise<HTMLElement> {
    // The cart is saved in localStorage, which other spec files can leave things in. An empty
    // cart every time, so the test does not depend on which files ran before.
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(ShopLayout);
    // Sends the footer's request; whenStable() would wait for an answer that is never sent.
    TestBed.tick();
    TestBed.inject(HttpTestingController)
      .expectOne((req) => req.url.endsWith('/api/categories'))
      .flush(categories);
    await fixture.whenStable();
    return fixture.nativeElement;
  }

  function category(id: number, name: string, productCount: number) {
    return { id, name, productCount, subcategories: [] };
  }

  it('links to the start page and the products', async () => {
    const element = await show();

    const links = [...element.querySelectorAll('a')].map((a) => [
      a.getAttribute('aria-label') ?? a.textContent!.trim(),
      a.getAttribute('href'),
    ]);
    // The closed cart (empty, so its "Utforska shoppen") and the closed phone menu are in the
    // page too, so "Shop" is there twice: in the header and in the menu.
    expect(links).toEqual([
      ['GREJ, till startsidan', '/'],
      ['Shop', '/produkter'],
      ['Utforska shoppen', '/produkter'],
      ['Shop', '/produkter'],
      ['Alla produkter', '/produkter'],
    ]);
  });

  it('shows the five biggest categories in the footer, in name order', async () => {
    const element = await show([
      category(1, 'Glas', 2),
      category(2, 'Keramik', 9),
      category(3, 'Konst', 8),
      category(4, 'Papper', 1),
      category(5, 'Smycken', 8),
      category(6, 'Textil', 8),
      category(7, 'Trä', 7),
    ]);

    const links = [...element.querySelectorAll('.footer-links a')].map((a) => [
      a.textContent!.trim(),
      a.getAttribute('href'),
    ]);
    expect(links).toEqual([
      ['Alla produkter', '/produkter'],
      ['Keramik', '/produkter?kategori=2'],
      ['Konst', '/produkter?kategori=3'],
      ['Smycken', '/produkter?kategori=5'],
      ['Textil', '/produkter?kategori=6'],
      ['Trä', '/produkter?kategori=7'],
    ]);
  });

  it("opens the cart from the phone menu's cart button", async () => {
    const element = await show();
    const [cartDialog, menuDialog] = [...element.querySelectorAll('dialog')];

    (element.querySelector('.menu-button') as HTMLButtonElement).click();
    expect(menuDialog.open).toBe(true);

    // The menu's own cart button; the header's cart button has the same class.
    (menuDialog.querySelector('.cart-button') as HTMLButtonElement).click();
    expect(menuDialog.open).toBe(false);
    expect(cartDialog.open).toBe(true);
  });

  it('shows the cart button with the number of products', async () => {
    const element = await show();
    // The drawer's own button, since the header has the theme button first and the menu has a
    // cart button too.
    const button = element.querySelector('app-cart-drawer .cart-button')!;

    expect(button.textContent!.trim()).toBe('0');
    expect(button.getAttribute('aria-label')).toBe('Varukorg, 0 grejer');
  });
});
