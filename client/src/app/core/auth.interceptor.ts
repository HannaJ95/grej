import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

// Runs for every request made with HttpClient (registered in app.config.ts).
// Adds the admin's token, so the API's [Authorize(Roles = Roles.Admin)] knows who is asking.
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.token();

  // The token is only sent to our own API, never to other sites.
  if (token === null || !request.url.startsWith(`${environment.apiUrl}/`)) {
    return next(request);
  }

  const withToken = request.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  return next(withToken).pipe(
    catchError((error: unknown) => {
      // The API did not accept the token, e.g. because it was made with another key.
      // The admin has to log in again to get a new one.
      if (error instanceof HttpErrorResponse && error.status === 401) {
        auth.logout();
        void router.navigateByUrl('/admin/logga-in');
      }
      return throwError(() => error);
    }),
  );
};
