import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ShopLayout } from './shop-layout';

describe('ShopLayout', () => {
  async function show(): Promise<HTMLElement> {
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
    // Shop twice: in the header, and in the phone menu, which is in the page but closed.
    expect(links).toEqual([
      ['GREJ, till startsidan', '/'],
      ['Shop', '/produkter'],
      ['Shop', '/produkter'],
      ['Alla produkter', '/produkter'],
    ]);
  });

  it("opens the cart from the phone menu's cart button", async () => {
    // jsdom, which the tests run in, has <dialog> but not showModal(). These stand-ins only
    // set open, which is all the test looks at. Each spec file gets its own jsdom, so they do
    // not reach other tests.
    HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
      this.open = true;
    };
    HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
      this.open = false;
    };
    const element = await show();
    const [cartDialog, menuDialog] = [...element.querySelectorAll('dialog')];

    (element.querySelector('.menu-button') as HTMLButtonElement).click();
    expect(menuDialog.open).toBe(true);

    (element.querySelector('.cart-button') as HTMLButtonElement).click();
    expect(menuDialog.open).toBe(false);
    expect(cartDialog.open).toBe(true);
  });

  it('shows the cart button', async () => {
    const element = await show();

    expect(element.querySelector('header button')!.textContent).toContain('Varukorg (0)');
  });
});
