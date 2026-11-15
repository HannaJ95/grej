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
        title: 'GREJ – handgjorda saker från små skapare',
        loadComponent: () =>
          import('./features/shop/landing-page/landing-page').then((m) => m.LandingPage),
      },
      {
        path: 'produkter',
        title: 'Alla grejer – GREJ',
        loadComponent: () =>
          import('./features/shop/product-list/product-list').then((m) => m.ProductList),
      },
      {
        path: 'produkter/:id',
        // ProductPage changes it to the product's name once it has loaded.
        title: 'Produkt – GREJ',
        loadComponent: () =>
          import('./features/shop/product-page/product-page').then((m) => m.ProductPage),
      },
      {
        path: 'om-grej',
        title: 'Om GREJ',
        loadComponent: () =>
          import('./features/shop/about-page/about-page').then((m) => m.AboutPage),
      },
      {
        path: 'villkor',
        title: 'Villkor – GREJ',
        loadComponent: () =>
          import('./features/shop/terms-page/terms-page').then((m) => m.TermsPage),
      },
      {
        path: 'kassa/tack',
        title: 'Tack för din beställning – GREJ',
        loadComponent: () =>
          import('./features/shop/success-page/success-page').then((m) => m.SuccessPage),
      },
    ],
  },
  {
    path: 'admin/logga-in',
    title: 'Logga in – GREJ admin',
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
        title: 'Översikt – GREJ admin',
        loadComponent: () =>
          import('./features/admin/admin-home/admin-home').then((m) => m.AdminHome),
      },
      {
        path: 'ordrar',
        title: 'Beställningar – GREJ admin',
        loadComponent: () =>
          import('./features/admin/admin-order-list/admin-order-list').then(
            (m) => m.AdminOrderList,
          ),
      },
      {
        path: 'ordrar/:id',
        title: 'Beställning – GREJ admin',
        loadComponent: () =>
          import('./features/admin/admin-order-details/admin-order-details').then(
            (m) => m.AdminOrderDetails,
          ),
      },
      {
        path: 'produkter',
        title: 'Produkter – GREJ admin',
        loadComponent: () =>
          import('./features/admin/admin-product-list/admin-product-list').then(
            (m) => m.AdminProductList,
          ),
      },
      {
        // Before 'produkter/:id', so "ny" is not read as an id.
        path: 'produkter/ny',
        title: 'Ny produkt – GREJ admin',
        loadComponent: () =>
          import('./features/admin/admin-product-form/admin-product-form').then(
            (m) => m.AdminProductForm,
          ),
      },
      {
        path: 'produkter/:id',
        title: 'Redigera produkt – GREJ admin',
        loadComponent: () =>
          import('./features/admin/admin-product-form/admin-product-form').then(
            (m) => m.AdminProductForm,
          ),
      },
      {
        // ?redigera=3 opens category 3 in the card.
        path: 'kategorier',
        title: 'Huvudkategorier – GREJ admin',
        loadComponent: () =>
          import('./features/admin/admin-main-categories/admin-main-categories').then(
            (m) => m.AdminMainCategories,
          ),
      },
      {
        path: 'underkategorier',
        title: 'Underkategorier – GREJ admin',
        loadComponent: () =>
          import('./features/admin/admin-subcategories/admin-subcategories').then(
            (m) => m.AdminSubcategories,
          ),
      },
      {
        // Only the subcategories of main category :id.
        path: 'underkategorier/:id',
        title: 'Underkategorier – GREJ admin',
        loadComponent: () =>
          import('./features/admin/admin-subcategories/admin-subcategories').then(
            (m) => m.AdminSubcategories,
          ),
      },
      {
        // data.kind is bound to the page's kind input. ?redigera=3 opens material 3 in the card.
        path: 'material',
        title: 'Material – GREJ admin',
        loadComponent: () =>
          import('./features/admin/admin-property-list/admin-property-list').then(
            (m) => m.AdminPropertyList,
          ),
        data: { kind: 'materials' },
      },
      {
        path: 'farger',
        title: 'Färger – GREJ admin',
        loadComponent: () =>
          import('./features/admin/admin-property-list/admin-property-list').then(
            (m) => m.AdminPropertyList,
          ),
        data: { kind: 'colors' },
      },
    ],
  },
];
