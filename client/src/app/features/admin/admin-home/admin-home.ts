import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth.service';

// The admin's start page, /admin. A placeholder until the CMS pages are built.
// Only a logged-in admin gets here (adminGuard in app.routes.ts).
@Component({
  selector: 'app-admin-home',
  template: `
    <!-- h2 for now, since app.html has the page's h1 until the layout is built. -->
    <h2>Admin</h2>
    @if (admin.hasValue()) {
      <p>Inloggad som {{ admin.value().email }}.</p>
    }
    <p>Här kommer du att hantera produkter, kategorier och ordrar.</p>
    <button type="button" (click)="logout()">Logga ut</button>
  `,
})
export class AdminHome {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  // Asks the API who is logged in. Proves that the token reaches the API and is accepted.
  protected readonly admin = this.auth.getAdmin();

  protected async logout(): Promise<void> {
    this.auth.logout();
    await this.router.navigateByUrl('/admin/logga-in');
  }
}
