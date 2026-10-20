import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'produkter/:id',
    // Lazy loading: the page's code is only downloaded when someone visits it.
    loadComponent: () => import('./features/shop/product-page/product-page').then((m) => m.ProductPage),
  },
];
