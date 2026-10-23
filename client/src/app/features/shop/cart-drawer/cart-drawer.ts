import { CurrencyPipe } from '@angular/common';
import { Component, ElementRef, inject, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../../core/cart.service';

// The cart button in the navigation and the panel it opens. The panel is a
// native <dialog>: the browser closes it on Escape, keeps the focus inside it
// while it is open and puts a backdrop behind it.
@Component({
  imports: [CurrencyPipe, RouterLink],
  selector: 'app-cart-drawer',
  styleUrl: './cart-drawer.scss',
  templateUrl: './cart-drawer.html',
})
export class CartDrawer {
  protected readonly cart = inject(CartService);

  // The <dialog #dialog> element in the template.
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  protected open(): void {
    this.dialog().nativeElement.showModal();
  }

  protected close(): void {
    this.dialog().nativeElement.close();
  }
}
