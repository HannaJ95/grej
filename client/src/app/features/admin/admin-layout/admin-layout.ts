import { Component, ElementRef, inject, viewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { Badge } from '../../../shared/badge/badge';
import { ConfirmDialog } from '../../../shared/confirm-dialog/confirm-dialog';
import { AdminNav } from '../admin-nav/admin-nav';

// The menu around every admin page except the login page. On tablets and phones an app bar
// opens it as a drawer.
@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, AdminNav, Badge, ConfirmDialog],
  templateUrl: './admin-layout.html',
  styleUrls: ['./admin-layout.scss', '../../../shared/drawer.scss'],
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

  // The menu covers the whole dialog, so a click on the dialog itself is on the backdrop. A click
  // on a link closes the drawer too, since the new page is shown behind it.
  protected closeOnBackdropOrLink(event: MouseEvent): void {
    const target = event.target as Element;
    if (target === event.currentTarget || target.closest('a')) {
      this.close();
    }
  }
}
