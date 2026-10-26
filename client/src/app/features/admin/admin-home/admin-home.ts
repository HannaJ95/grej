import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth.service';

// The admin's start page, /admin. A placeholder until the CMS pages are built.
// A route guard that only lets a logged-in admin in is added in the next sprint item.
@Component({
  selector: 'app-admin-home',
  template: `
    <!-- h2 for now, since app.html has the page's h1 until the layout is built. -->
    <h2>Admin</h2>
    <p>Här kommer du att hantera produkter, kategorier och ordrar.</p>
    <button type="button" (click)="logout()">Logga ut</button>
  `,
})
export class AdminHome {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected async logout(): Promise<void> {
    this.auth.logout();
    await this.router.navigateByUrl('/admin/logga-in');
  }
}
