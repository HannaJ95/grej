import { HttpClient, HttpErrorResponse, httpResource } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

// What POST /api/auth/login returns: the token for admin requests, and when it
// stops working (UTC, e.g. "2026-10-26T23:00:00Z").
export interface AuthSession {
  token: string;
  expiresAt: string;
}

// What GET /api/auth/me returns: who is logged in.
export interface Admin {
  email: string;
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

  // The logged-in admin, from GET /api/auth/me. Must be called when a component
  // is created (in a field), like getProduct in ProductService.
  getAdmin() {
    return httpResource<Admin>(() => `${environment.apiUrl}/api/auth/me`);
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
