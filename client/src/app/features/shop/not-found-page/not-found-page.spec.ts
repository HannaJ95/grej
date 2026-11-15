import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../../app.routes';

describe('NotFoundPage', () => {
  let httpTesting: HttpTestingController;
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    // The app's real routes, since the order of the routes is what is tested.
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    });
    httpTesting = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create();
  });

  afterEach(() => httpTesting.verify());

  it('shows the page for an address the shop does not know', async () => {
    await harness.navigateByUrl('/finns-inte');
    // The shop's footer asks for the categories on every page.
    httpTesting.expectOne((req) => req.url.endsWith('/api/categories')).flush([]);
    await harness.fixture.whenStable();

    expect(heading()).toBe('Sidan finns inte');
    expect(document.title).toBe('Sidan finns inte – GREJ');
  });

  it('still shows the login page for the admin', async () => {
    await harness.navigateByUrl('/admin/logga-in');

    expect(heading()).toBe('Logga in som admin');
  });

  function heading(): string | undefined {
    return harness.fixture.nativeElement.querySelector('h1')?.textContent.trim();
  }
});
