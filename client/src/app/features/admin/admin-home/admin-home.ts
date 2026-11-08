import { Component } from '@angular/core';

// /admin. Only a logged-in admin gets here (adminGuard in app.routes.ts).
@Component({
  selector: 'app-admin-home',
  template: `
    <h1 class="text-display-xs">Översikt</h1>
    <p>Välj vad du vill hantera i menyn.</p>
  `,
})
export class AdminHome {}
