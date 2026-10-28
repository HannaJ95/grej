import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../../app.routes';

describe('ProductList', () => {
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      // The app's real routes, so ?sida= reaches the page the same way as in the app.
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('fetches the page in ?sida= and links to the pages before and after', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/produkter?sida=2');

    const request = httpTesting.expectOne((req) => req.url.endsWith('/api/products'));
    expect(request.request.params.get('page')).toBe('2');
    request.flush({
      items: [{ id: 7, title: 'Vas', description: '', price: 300, currency: 'SEK', isSoldOut: false }],
      page: 2,
      pageSize: 12,
      totalCount: 25,
      totalPages: 3,
    });
    await harness.fixture.whenStable();

    const links = [...harness.routeNativeElement!.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    expect(links).toEqual(['/produkter/7', '/produkter?sida=1', '/produkter?sida=3']);
    expect(harness.routeNativeElement!.textContent).toContain('Sida 2 av 3');
  });

  it('shows the image of each product, with its alt text', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/produkter');

    httpTesting.expectOne((req) => req.url.endsWith('/api/products')).flush({
      items: [
        {
          id: 7,
          title: 'Vas',
          description: '',
          price: 300,
          currency: 'SEK',
          stock: 1,
          isSoldOut: false,
          image: { url: 'https://storage.test/vas.png', altText: 'En blå vas' },
        },
      ],
      page: 1,
      pageSize: 12,
      totalCount: 1,
      totalPages: 1,
    });
    await harness.fixture.whenStable();

    const image = harness.routeNativeElement!.querySelector('img')!;
    expect(image.getAttribute('src')).toBe('https://storage.test/vas.png');
    expect(image.getAttribute('alt')).toBe('En blå vas');
  });
});
