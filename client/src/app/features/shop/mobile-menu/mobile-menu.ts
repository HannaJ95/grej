import { Component, ElementRef, inject, output, viewChild } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from '../../../core/cart.service';
import { Icon } from '../../../shared/icons/icon';
import { IconButton } from '../../../shared/icon-button/icon-button';

// The menu button on phones and the panel it opens (Figma: Menu drawer). Built like the cart:
// a native <dialog>, so the browser closes it on Escape, keeps the focus inside it and puts a
// backdrop behind it. Only the pages that exist are in it; more links come with more pages.
@Component({
  selector: 'app-mobile-menu',
  imports: [RouterLink, RouterLinkActive, Icon, IconButton],
  templateUrl: './mobile-menu.html',
  styleUrl: './mobile-menu.scss',
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

  // A click on the dialog element itself is a click on the dark backdrop, since the panel
  // inside it covers the rest. The design closes the menu then.
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
