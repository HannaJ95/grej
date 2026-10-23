import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [App],
      // Replaces real HTTP calls with a fake backend that the test controls.
      providers: [
        // The links in the navigation need a router. No routes are needed here.
        provideRouter([]),
        // Replaces real HTTP calls with a fake backend that the test controls.
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('shows OK when the API and database respond', async () => {
    const fixture = TestBed.createComponent(App);

    httpTesting.expectOne((req) => req.url.endsWith('/api/health/database')).flush({ status: 'ok' });
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('API och databas: OK');
  });

  it('shows an error when the API cannot be reached', async () => {
    const fixture = TestBed.createComponent(App);

    httpTesting
      .expectOne((req) => req.url.endsWith('/api/health/database'))
      .flush(null, { status: 503, statusText: 'Service Unavailable' });
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Kunde inte nå API:t');
  });
});
