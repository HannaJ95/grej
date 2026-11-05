import { Routes } from '@angular/router';
import { adminGuard } from './core/admin.guard';

export const routes: Routes = [
  {
    // Every shop page is a child here, so they are all shown inside the shop's layout.
    // The router tries the children first; a URL none of them matches, like /admin, goes on
    // to the routes below.
    path: '',
    loadComponent: () => import('./features/shop/shop-layout/shop-layout').then((m) => m.ShopLayout),
    children: [
      {
        // The start page. Stripe's cancel URL (/) also ends up here.
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
        // Lazy loading: the page's code is only downloaded when someone visits it.
        loadComponent: () =>
          import('./features/shop/product-page/product-page').then((m) => m.ProductPage),
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
    path: 'admin',
    // Every admin page is a child here, so the guard protects them all.
    canActivateChild: [adminGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/admin/admin-home/admin-home').then((m) => m.AdminHome),
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
      {
        path: 'material',
        loadComponent: () =>
          import('./features/admin/admin-property-list/admin-property-list').then(
            (m) => m.AdminPropertyList,
          ),
        // The same page as 'farger'. withComponentInputBinding passes data to the page's
        // kind input, which picks the API's URL and the words.
        data: { kind: 'materials' },
      },
      {
        // Before 'material/:id', like 'produkter/ny'.
        path: 'material/ny',
        loadComponent: () =>
          import('./features/admin/admin-property-form/admin-property-form').then(
            (m) => m.AdminPropertyForm,
          ),
        data: { kind: 'materials' },
      },
      {
        path: 'material/:id',
        loadComponent: () =>
          import('./features/admin/admin-property-form/admin-property-form').then(
            (m) => m.AdminPropertyForm,
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
      {
        path: 'farger/ny',
        loadComponent: () =>
          import('./features/admin/admin-property-form/admin-property-form').then(
            (m) => m.AdminPropertyForm,
          ),
        data: { kind: 'colors' },
      },
      {
        path: 'farger/:id',
        loadComponent: () =>
          import('./features/admin/admin-property-form/admin-property-form').then(
            (m) => m.AdminPropertyForm,
          ),
        data: { kind: 'colors' },
      },
    ],
  },
];
