import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LandingPage } from './landing-page';

describe('LandingPage', () => {
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  // A product as the API returns it, with only what the cards show.
  function product(id: number, title: string) {
    return {
      id,
      title,
      description: '',
      price: 300,
      currency: 'SEK',
      isSoldOut: false,
      image: null,
    };
  }

  it('shows the four newest products from the first page', async () => {
    const fixture = TestBed.createComponent(LandingPage);
    // Runs the page's first update, which sends the request. whenStable() would wait for
    // the answer, which the test has not sent yet.
    TestBed.tick();

    const request = httpTesting.expectOne((req) => req.url.endsWith('/api/products'));
    expect(request.request.params.get('page')).toBe('1');
    request.flush({
      items: [
        product(9, 'Vas'),
        product(8, 'Kudde'),
        product(7, 'Ring'),
        product(6, 'Tryck'),
        product(5, 'Skål'),
      ],
      page: 1,
      pageSize: 12,
      totalCount: 5,
      totalPages: 1,
    });
    await fixture.whenStable();

    // Each card's link is its title.
    const links = [
      ...fixture.nativeElement.querySelectorAll('app-product-card a'),
    ] as HTMLAnchorElement[];
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/produkter/9',
      '/produkter/8',
      '/produkter/7',
      '/produkter/6',
    ]);
    expect(links[0].textContent).toBe('Vas');
  });

  it('shows an error when the products cannot be fetched', async () => {
    const fixture = TestBed.createComponent(LandingPage);
    TestBed.tick();

    httpTesting
      .expectOne((req) => req.url.endsWith('/api/products'))
      .flush(null, { status: 503, statusText: 'Service Unavailable' });
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Nyheterna kunde inte visas.');
  });
});
