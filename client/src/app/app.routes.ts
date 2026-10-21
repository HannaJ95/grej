import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'produkter/:id',
    // Lazy loading: the page's code is only downloaded when someone visits it.
    loadComponent: () => import('./features/shop/product-page/product-page').then((m) => m.ProductPage),
  },
  {
    path: 'kassa/tack',
    loadComponent: () => import('./features/shop/success-page/success-page').then((m) => m.SuccessPage),
  },
];
