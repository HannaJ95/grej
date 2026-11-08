import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AddedToCart } from '../added-to-cart/added-to-cart';
import { CartDrawer } from '../cart-drawer/cart-drawer';
import { MobileMenu } from '../mobile-menu/mobile-menu';

// The header and footer around every shop page. The shop's routes are its children in
// app.routes.ts.
@Component({
  selector: 'app-shop-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, AddedToCart, CartDrawer, MobileMenu],
  templateUrl: './shop-layout.html',
  styleUrl: './shop-layout.scss',
})
export class ShopLayout {}
