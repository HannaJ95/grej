import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ShopLayout } from './shop-layout';

describe('ShopLayout', () => {
  async function show(): Promise<HTMLElement> {
    // The cart is saved in localStorage, which other spec files can leave things in. An empty
    // cart every time, so the test does not depend on which files ran before.
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        // The cart's checkout service needs HttpClient, even though nothing is sent here.
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    const fixture = TestBed.createComponent(ShopLayout);
    await fixture.whenStable();
    return fixture.nativeElement;
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

  it('shows the cart button', async () => {
    const element = await show();

    expect(element.querySelector('header button')!.textContent).toContain('Varukorg (0)');
  });
});
