import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  const meUrl = `${environment.apiUrl}/api/auth/me`;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      // The same setup as app.config.ts, with a fake backend.
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('sends the token to the API when the admin is logged in', () => {
    logIn();

    http.get(meUrl).subscribe();

    const request = httpTesting.expectOne(meUrl);
    expect(request.request.headers.get('Authorization')).toBe('Bearer header.payload.signature');
  });

  it('sends no token when nobody is logged in', () => {
    http.get(meUrl).subscribe();

    expect(httpTesting.expectOne(meUrl).request.headers.has('Authorization')).toBe(false);
  });

  it('never sends the token to other sites', () => {
    logIn();

    http.get('https://example.com/bild.jpg').subscribe();

    const request = httpTesting.expectOne('https://example.com/bild.jpg');
    expect(request.request.headers.has('Authorization')).toBe(false);
  });

  it('logs out and goes to the login page when the API rejects the token', () => {
    logIn();
    // Records the call instead of navigating, since this test has no pages.
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    // The page that made the request still gets the error.
    let failed = false;
    http.get(meUrl).subscribe({ error: () => (failed = true) });
    httpTesting.expectOne(meUrl).flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(failed).toBe(true);
    expect(TestBed.inject(AuthService).isLoggedIn()).toBe(false);
    expect(navigate).toHaveBeenCalledWith('/admin/logga-in');
  });
});

// A login that is valid for a long time, saved the same way AuthService.login saves it.
function logIn(): void {
  localStorage.setItem(
    'grej.auth',
    JSON.stringify({ token: 'header.payload.signature', expiresAt: '2999-01-01T00:00:00Z' }),
  );
}
