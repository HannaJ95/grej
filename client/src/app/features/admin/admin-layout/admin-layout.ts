import { Component, ElementRef, inject, viewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { Badge } from '../../../shared/badge/badge';
import { AdminNav } from '../admin-nav/admin-nav';

// The frame around every admin page except the login page: the menu, and on tablets and phones
// the app bar with a button that opens the menu as a drawer. The admin pages are its children in
// app.routes.ts and are shown in <router-outlet />, like ShopLayout for the shop.
@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, AdminNav, Badge],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss',
})
export class AdminLayout {
  // Read once from the token when the layout is created, i.e. after the login. Logging out
  // leaves the layout, so it is never out of date.
  protected readonly email = inject(AuthService).email() ?? undefined;
  protected readonly initial = this.email?.charAt(0).toUpperCase() ?? '';

  private readonly drawer = viewChild.required<ElementRef<HTMLDialogElement>>('drawer');

  protected open(): void {
    this.drawer().nativeElement.showModal();
  }

  protected close(): void {
    this.drawer().nativeElement.close();
  }

  // A click on the dialog element itself is a click on the backdrop, since the menu covers the
  // rest of it (like MobileMenu). A click on a link closes the drawer too, since the new page is
  // shown behind it.
  protected closeOnBackdropOrLink(event: MouseEvent): void {
    const target = event.target as Element;
    if (target === event.currentTarget || target.closest('a')) {
      this.close();
    }
  }
}
