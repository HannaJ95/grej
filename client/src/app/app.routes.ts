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
      {
        path: 'produkter',
        loadComponent: () =>
          import('./features/admin/admin-product-list/admin-product-list').then(
            (m) => m.AdminProductList,
          ),
      },
      {
        // Before 'produkter/:id', otherwise "ny" would be read as an id.
        path: 'produkter/ny',
        loadComponent: () =>
          import('./features/admin/admin-product-form/admin-product-form').then(
            (m) => m.AdminProductForm,
          ),
      },
      {
        path: 'produkter/:id',
        loadComponent: () =>
          import('./features/admin/admin-product-form/admin-product-form').then(
            (m) => m.AdminProductForm,
          ),
      },
      {
        path: 'kategorier',
        loadComponent: () =>
          import('./features/admin/admin-category-list/admin-category-list').then(
            (m) => m.AdminCategoryList,
          ),
      },
      {
        // Before 'kategorier/:id', like 'produkter/ny'.
        path: 'kategorier/ny',
        loadComponent: () =>
          import('./features/admin/admin-category-form/admin-category-form').then(
            (m) => m.AdminCategoryForm,
          ),
      },
      {
        path: 'kategorier/:id',
        loadComponent: () =>
          import('./features/admin/admin-category-form/admin-category-form').then(
            (m) => m.AdminCategoryForm,
          ),
      },
    ],
  },
];
