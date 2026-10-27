import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

// Runs before every page under /admin (app.routes.ts). Sends anyone who is not
// logged in to the login page. This only hides pages: the API checks the role
// on every admin request (constraints.md).
export const adminGuard: CanActivateChildFn = () => {
  if (inject(AuthService).isLoggedIn()) {
    return true;
  }
  return inject(Router).createUrlTree(['/admin/logga-in']);
};
