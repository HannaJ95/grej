import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../../app.routes';
import { CartService } from '../../../core/cart.service';
import { Product } from '../../../core/product.service';

const vase: Product = {
  id: 1,
  title: 'Vas',
  description: '',
  price: 300,
  currency: 'SEK',
  stock: 3,
  isSoldOut: false,
  image: null,
  materials: [],
  colors: [],
};

describe('ProductPage', () => {
  let httpTesting: HttpTestingController;
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    // Every test starts as a new visitor with nothing saved.
    localStorage.clear();
    TestBed.configureTestingModule({
      // The app's real routes, so :id reaches the page the same way as in the app.
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

  it('shows the materials and colors', async () => {
    await openVase({ materials: ['Glasyr', 'Lera'], colors: ['Blå'] });

    expect(texts('dt')).toEqual(['Material', 'Färg']);
    expect(texts('dd')).toEqual(['Glasyr, Lera', 'Blå']);
  });

  it('leaves out what the product has none of', async () => {
    await openVase({ materials: [], colors: ['Blå'] });

    expect(texts('dt')).toEqual(['Färg']);
  });

  it('shows no list when the product has no materials or colors', async () => {
    await openVase({ materials: [], colors: [] });

    expect(page().querySelector('dl')).toBeNull();
  });

  it('shortens a long description, and "Mer information" opens the whole one', async () => {
    const description =
      'Handdrejad skål i stengods med en djupblå glasyr, '.repeat(4) + 'som tål diskmaskin.';
    await openVase({ description });
    const details = page().querySelector('details')!;
    // jsdom cannot scroll.
    details.scrollIntoView = vi.fn();

    const intro = page().querySelector('.intro')!.textContent!;
    expect(intro).toContain('glasyr…');
    expect(intro).not.toContain('diskmaskin');
    expect(details.open).toBe(false);
    expect(details.textContent).toContain(description);

    button('Mer information').click();

    expect(details.open).toBe(true);
    expect(details.scrollIntoView).toHaveBeenCalled();
  });

  it('shows a short description whole, without "Mer information"', async () => {
    await openVase({ description: 'En liten vas.' });

    expect(page().querySelector('.intro')!.textContent!.trim()).toBe('En liten vas.');
    expect(page().querySelector('.more')).toBeNull();
    expect(page().querySelector('details')!.textContent).toContain('En liten vas.');
  });

  it('adds the chosen number to the cart', async () => {
    await openVase({});

    page().querySelector<HTMLButtonElement>('[aria-label="Öka antal Vas"]')!.click();
    await harness.fixture.whenStable();
    button('Lägg i varukorg').click();
    await harness.fixture.whenStable();

    expect(TestBed.inject(CartService).items()[0].quantity).toBe(2);
    // Back to 1 for the next time. Only the page's stepper; the cart has one too.
    expect(page().querySelector('app-product-page .quantity')!.textContent).toBe('1');
  });

  it('shows no buy row when the product is sold out', async () => {
    await openVase({ stock: 0, isSoldOut: true });

    expect(page().querySelector('.buy')).toBeNull();
  });

  function page(): HTMLElement {
    return harness.routeNativeElement!;
  }

  function button(text: string): HTMLButtonElement {
    return [...page().querySelectorAll('button')].find((b) => b.textContent!.trim() === text)!;
  }

  // The text of every element that matches, e.g. every <dt>.
  function texts(selector: string): string[] {
    return [...page().querySelectorAll(selector)].map((element) => element.textContent!.trim());
  }

  // Opens /produkter/1 and answers the API's GET with the vase, changed as given.
  async function openVase(changes: Partial<Product>): Promise<void> {
    await harness.navigateByUrl('/produkter/1');
    httpTesting
      .expectOne((req) => req.url.endsWith('/api/products/1'))
      .flush({ ...vase, ...changes });
    await harness.fixture.whenStable();
  }
});
