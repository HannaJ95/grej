import { Routes } from '@angular/router';
import { adminGuard } from './core/admin.guard';

export const routes: Routes = [
  // The start page is the product list. Stripe's cancel URL (/) also ends up here.
  { path: '', redirectTo: 'produkter', pathMatch: 'full' },
  {
    path: 'produkter',
    loadComponent: () => import('./features/shop/product-list/product-list').then((m) => m.ProductList),
  },
  {
    path: 'produkter/:id',
    // Lazy loading: the page's code is only downloaded when someone visits it.
    loadComponent: () => import('./features/shop/product-page/product-page').then((m) => m.ProductPage),
  },
  {
    path: 'kassa/tack',
    loadComponent: () => import('./features/shop/success-page/success-page').then((m) => m.SuccessPage),
  },
  {
    path: 'admin/logga-in',
    loadComponent: () => import('./features/admin/login-page/login-page').then((m) => m.LoginPage),
  },
  {
    path: 'admin',
    // Every admin page is a child here, so the guard protects them all.
    canActivateChild: [adminGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/admin/admin-home/admin-home').then((m) => m.AdminHome),
      },
    ],
  },
];
