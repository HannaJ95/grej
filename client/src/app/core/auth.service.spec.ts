import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let auth: AuthService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    auth = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('saves the token when the API accepts the login', async () => {
    const result = auth.login('admin@example.com', 'Rätt-lösenord-1');

    const request = httpTesting.expectOne((req) => req.url.endsWith('/api/auth/login'));
    expect(request.request.body).toEqual({
      email: 'admin@example.com',
      password: 'Rätt-lösenord-1',
    });
    // The same JSON as AuthController sends with Ok.
    request.flush({ token: 'header.payload.signature', expiresAt: '2026-10-26T23:00:00Z' });

    expect(await result).toBe(true);
    expect(JSON.parse(localStorage.getItem('grej.auth')!)).toEqual({
      token: 'header.payload.signature',
      expiresAt: '2026-10-26T23:00:00Z',
    });
  });

  it('returns false and saves nothing when the API answers 401', async () => {
    const result = auth.login('admin@example.com', 'Fel-lösenord-1');

    httpTesting
      .expectOne((req) => req.url.endsWith('/api/auth/login'))
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(await result).toBe(false);
    expect(localStorage.getItem('grej.auth')).toBeNull();
  });

  it('throws on other errors, e.g. when the API is down', async () => {
    const result = auth.login('admin@example.com', 'Rätt-lösenord-1');

    httpTesting
      .expectOne((req) => req.url.endsWith('/api/auth/login'))
      .flush(null, { status: 500, statusText: 'Internal Server Error' });

    await expect(result).rejects.toThrow();
  });

  it('forgets the token on logout', () => {
    localStorage.setItem('grej.auth', '{"token":"t","expiresAt":"2026-10-26T23:00:00Z"}');

    auth.logout();

    expect(localStorage.getItem('grej.auth')).toBeNull();
  });
});
