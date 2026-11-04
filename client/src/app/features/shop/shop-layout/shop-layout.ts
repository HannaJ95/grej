import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CartDrawer } from '../cart-drawer/cart-drawer';
import { MobileMenu } from '../mobile-menu/mobile-menu';

// The frame around every shop page: the header with the logo, the menu and the cart, and the
// footer. The shop's pages are its children in app.routes.ts and are shown in <router-outlet />,
// like a layout.tsx in Next.js. The admin pages are not inside it.
@Component({
  selector: 'app-shop-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, CartDrawer, MobileMenu],
  templateUrl: './shop-layout.html',
  styleUrl: './shop-layout.scss',
})
export class ShopLayout {}
