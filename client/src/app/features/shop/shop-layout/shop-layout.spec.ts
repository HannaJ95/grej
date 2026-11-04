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
    expect(links).toEqual([
      ['GREJ, till startsidan', '/'],
      ['Shop', '/produkter'],
      ['Alla produkter', '/produkter'],
    ]);
  });

  it('shows the cart button', async () => {
    const element = await show();

    expect(element.querySelector('header button')!.textContent).toContain('Varukorg (0)');
  });
});
