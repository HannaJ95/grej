import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../../app.routes';

describe('LoginPage', () => {
  let httpTesting: HttpTestingController;
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    });
    httpTesting = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create('/admin/logga-in');
  });

  afterEach(() => httpTesting.verify());

  it('shows what is missing and sends nothing when the form is empty', async () => {
    await send();

    expect(page().textContent).toContain('Fyll i din e-postadress.');
    expect(page().textContent).toContain('Fyll i ditt lösenord.');
  });

  it('shows an error and stays on the page when the API answers 401', async () => {
    type('#email', 'admin@example.com');
    type('#password', 'Fel-lösenord-1');
    await send();

    httpTesting
      .expectOne((req) => req.url.endsWith('/api/auth/login'))
      .flush(null, { status: 401, statusText: 'Unauthorized' });
    await settle();

    expect(page().querySelector('[role="alert"]')?.textContent).toContain(
      'Fel e-postadress eller lösenord.',
    );
    expect(TestBed.inject(Router).url).toBe('/admin/logga-in');
  });

  it('goes to /admin after logging in', async () => {
    type('#email', 'admin@example.com');
    type('#password', 'Rätt-lösenord-1');
    await send();

    httpTesting
      .expectOne((req) => req.url.endsWith('/api/auth/login'))
      // An expiry in the future, so adminGuard lets the admin in.
      .flush({ token: 'header.payload.signature', expiresAt: '2999-01-01T00:00:00Z' });

    // The router opens /admin, which asks the API who is logged in. waitFor tries
    // again until that request has been made.
    const me = await vi.waitFor(() =>
      httpTesting.expectOne((req) => req.url.endsWith('/api/auth/me')),
    );
    me.flush({ email: 'admin@example.com' });
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/admin');
  });

  function page(): HTMLElement {
    return harness.routeNativeElement!;
  }

  // Types into an input the way a user does, so Signal Forms sees the change.
  function type(selector: string, value: string): void {
    const input = page().querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  // Lets the login finish after the API has answered (the answer, then the
  // navigation), and waits until the page has updated.
  async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    await harness.fixture.whenStable();
  }

  // Clicks "Logga in" and waits until the page has updated.
  async function send(): Promise<void> {
    page().querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    await harness.fixture.whenStable();
  }
});
