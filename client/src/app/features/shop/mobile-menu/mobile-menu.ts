import { Component, ElementRef, inject, output, viewChild } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from '../../../core/cart.service';
import { Icon } from '../../../shared/icons/icon';
import { IconButton } from '../../../shared/icon-button/icon-button';
import { ThemeToggle } from '../../../shared/theme-toggle/theme-toggle';

// The phone menu. A native <dialog> like the cart, so the browser handles Escape, the focus and
// the backdrop.
@Component({
  selector: 'app-mobile-menu',
  imports: [RouterLink, RouterLinkActive, Icon, IconButton, ThemeToggle],
  templateUrl: './mobile-menu.html',
  styleUrls: ['./mobile-menu.scss', '../../../shared/drawer.scss'],
})
export class MobileMenu {
  protected readonly cart = inject(CartService);

  // Tells the layout to open the cart, which lives in the header and not in the menu.
  readonly openCart = output();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  protected open(): void {
    this.dialog().nativeElement.showModal();
  }

  protected close(): void {
    this.dialog().nativeElement.close();
  }

  // The panel covers the whole dialog, so a click on the dialog itself is on the backdrop.
  protected closeOnBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  protected goToCart(): void {
    this.close();
    this.openCart.emit();
  }
}
