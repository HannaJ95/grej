import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../app.routes';

describe('adminGuard', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      // The app's real routes, so the guard runs the same way as in the browser.
      // The admin pages call the API, so they need HttpClient (with a fake backend).
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('sends a visitor who is not logged in to the login page', async () => {
    expect(await visitAdmin()).toBe('/admin/logga-in');
  });

  it('sends the admin to the login page when the login has expired', async () => {
    localStorage.setItem('grej.auth', '{"token":"t","expiresAt":"2000-01-01T00:00:00Z"}');

    expect(await visitAdmin()).toBe('/admin/logga-in');
  });

  it('lets a logged-in admin in', async () => {
    localStorage.setItem('grej.auth', '{"token":"t","expiresAt":"2999-01-01T00:00:00Z"}');

    expect(await visitAdmin()).toBe('/admin');
  });
});

// Goes to /admin and returns the URL the router ended up on.
async function visitAdmin(): Promise<string> {
  const harness = await RouterTestingHarness.create();
  await harness.navigateByUrl('/admin');
  return TestBed.inject(Router).url;
}
