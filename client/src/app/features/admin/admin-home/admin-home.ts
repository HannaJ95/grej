import { Component } from '@angular/core';

// The admin's start page, /admin. The menu with every CMS page is in AdminLayout. The overview
// with numbers in Figma (Admin – Översikt) is not built yet.
// Only a logged-in admin gets here (adminGuard in app.routes.ts).
@Component({
  selector: 'app-admin-home',
  template: `
    <h1 class="text-display-xs">Översikt</h1>
    <p>Välj vad du vill hantera i menyn.</p>
  `,
})
export class AdminHome {}
