import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../../app.routes';
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

  function page(): HTMLElement {
    return harness.routeNativeElement!;
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
