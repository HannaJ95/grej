import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

// What POST /api/auth/login returns: the token for admin requests, and when it
// stops working (UTC, e.g. "2026-10-26T23:00:00Z").
export interface AuthSession {
  token: string;
  expiresAt: string;
}

// Where the login is saved in the browser.
const STORAGE_KEY = 'grej.auth';

// Logs the admin in and out. The token is saved in localStorage, so the admin
// stays logged in after a page reload until it expires (8 hours).
@Service()
export class AuthService {
  private readonly http = inject(HttpClient);

  // Resolves with true when logged in, and false when the email or password is
  // wrong or the account is locked. Throws on other errors, e.g. when the API is down.
  async login(email: string, password: string): Promise<boolean> {
    try {
      const session = await firstValueFrom(
        this.http.post<AuthSession>(`${environment.apiUrl}/api/auth/login`, { email, password }),
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      return true;
    } catch (error) {
      // 401: the API gives the same answer for every kind of failed login.
      if (error instanceof HttpErrorResponse && error.status === 401) {
        return false;
      }
      throw error;
    }
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  // The saved token, or null when nobody is logged in or the token has expired.
  // An expired token is never sent, since the API would answer 401 anyway.
  token(): string | null {
    const session = readSession();
    if (session === null || Date.parse(session.expiresAt) <= Date.now()) {
      return null;
    }
    return session.token;
  }

  isLoggedIn(): boolean {
    return this.token() !== null;
  }

  // The logged-in admin's email, read from the token, or null. A JWT is three parts with dots
  // between them, and the middle one is JSON in base64url: signed, so it cannot be changed, but
  // not secret. The API puts the email there (IdentityLoginService), so the menu can show it
  // without asking the API.
  email(): string | null {
    const token = this.token();
    if (token === null) {
      return null;
    }
    try {
      // base64url has - and _ where atob expects + and /.
      const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const email: unknown = JSON.parse(atob(payload)).email;
      return typeof email === 'string' ? email : null;
    } catch {
      // Not a JWT, e.g. "t" in the tests.
      return null;
    }
  }
}

// The saved login, or null if there is none or it cannot be read.
function readSession(): AuthSession | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === null ? null : (JSON.parse(saved) as AuthSession);
  } catch {
    return null;
  }
}
