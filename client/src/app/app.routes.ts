import { Routes } from '@angular/router';
import { adminGuard } from './core/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/shop/shop-layout/shop-layout').then((m) => m.ShopLayout),
    children: [
      {
        // Also Stripe's cancel URL.
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/shop/landing-page/landing-page').then((m) => m.LandingPage),
      },
      {
        path: 'produkter',
        loadComponent: () =>
          import('./features/shop/product-list/product-list').then((m) => m.ProductList),
      },
      {
        path: 'produkter/:id',
        loadComponent: () =>
          import('./features/shop/product-page/product-page').then((m) => m.ProductPage),
      },
      {
        path: 'om-grej',
        loadComponent: () =>
          import('./features/shop/about-page/about-page').then((m) => m.AboutPage),
      },
      {
        path: 'kassa/tack',
        loadComponent: () =>
          import('./features/shop/success-page/success-page').then((m) => m.SuccessPage),
      },
    ],
  },
  {
    path: 'admin/logga-in',
    loadComponent: () => import('./features/admin/login-page/login-page').then((m) => m.LoginPage),
  },
  {
    // The guard protects every child. The login page above stays outside.
    path: 'admin',
    loadComponent: () =>
      import('./features/admin/admin-layout/admin-layout').then((m) => m.AdminLayout),
    canActivateChild: [adminGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/admin/admin-home/admin-home').then((m) => m.AdminHome),
      },
      {
        path: 'ordrar',
        loadComponent: () =>
          import('./features/admin/admin-order-list/admin-order-list').then(
            (m) => m.AdminOrderList,
          ),
      },
      {
        path: 'ordrar/:id',
        loadComponent: () =>
          import('./features/admin/admin-order-details/admin-order-details').then(
            (m) => m.AdminOrderDetails,
          ),
      },
      {
        path: 'produkter',
        loadComponent: () =>
          import('./features/admin/admin-product-list/admin-product-list').then(
            (m) => m.AdminProductList,
          ),
      },
      {
        // Before 'produkter/:id', so "ny" is not read as an id.
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
        // ?redigera=3 opens category 3 in the card.
        path: 'kategorier',
        loadComponent: () =>
          import('./features/admin/admin-main-categories/admin-main-categories').then(
            (m) => m.AdminMainCategories,
          ),
      },
      {
        path: 'underkategorier',
        loadComponent: () =>
          import('./features/admin/admin-subcategories/admin-subcategories').then(
            (m) => m.AdminSubcategories,
          ),
      },
      {
        // Only the subcategories of main category :id.
        path: 'underkategorier/:id',
        loadComponent: () =>
          import('./features/admin/admin-subcategories/admin-subcategories').then(
            (m) => m.AdminSubcategories,
          ),
      },
      {
        // data.kind is bound to the page's kind input. ?redigera=3 opens material 3 in the card.
        path: 'material',
        loadComponent: () =>
          import('./features/admin/admin-property-list/admin-property-list').then(
            (m) => m.AdminPropertyList,
          ),
        data: { kind: 'materials' },
      },
      {
        path: 'farger',
        loadComponent: () =>
          import('./features/admin/admin-property-list/admin-property-list').then(
            (m) => m.AdminPropertyList,
          ),
        data: { kind: 'colors' },
      },
    ],
  },
];
